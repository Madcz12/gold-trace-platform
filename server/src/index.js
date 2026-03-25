import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { sequelize } from './models/index.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import lotRoutes from './routes/lots.js';
import sampleRoutes from './routes/samples.js';
import barRoutes from './routes/bars.js';
import transferRoutes from './routes/transfers.js';
import auditRoutes from './routes/audit.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Security & Parsing ───
app.use(helmet());
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Rate limiting on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Demasiados intentos. Por favor, intente de nuevo en 15 minutos.' },
});
app.use('/api/auth/login', authLimiter);

// ─── Routes ───
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/lots', lotRoutes);
app.use('/api/lots', sampleRoutes);
app.use('/api/bars', barRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api', auditRoutes);  // for /api/dashboard and /api/reports/*

// ─── Health Check ───
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Global Error Handler ───
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// ─── Start ───
async function start() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Sync models (in dev — use migrations in production)
    // Desactivamos alter: true para evitar el error de PostgreSQL con BIGSERIAL
    await sequelize.sync({ alter: false });
    console.log('✅ Models synced');

    // Seed admin user if not exists
    const { User } = await import('./models/index.js');
    const adminExists = await User.findOne({ where: { role: 'admin' } });
    if (!adminExists) {
      await User.create({
        username: 'admin',
        email: 'admin@goldtrace.co',
        password: 'admin123',
        fullName: 'Administrador del Sistema',
        role: 'admin',
      });
      console.log('✅ Admin user seeded (admin / admin123)');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Gold Trace API running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Server failed to start:', err);
    process.exit(1);
  }
}

start();
