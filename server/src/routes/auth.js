import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }

    const user = await User.findOne({ where: { username } });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const valid = await user.validatePassword(password);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({
      token,
      user: user.toSafeJSON(),
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/auth/register — Admin only
router.post('/register', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { username, email, password, fullName, role } = req.body;

    if (!username || !email || !password || !fullName || !role) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const existing = await User.findOne({ where: { username } });
    if (existing) {
      return res.status(409).json({ error: 'El nombre de usuario ya existe' });
    }

    const user = await User.create({ username, email, password, fullName, role });
    res.status(201).json(user.toSafeJSON());
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  res.json(req.user.toSafeJSON());
});

export default router;
