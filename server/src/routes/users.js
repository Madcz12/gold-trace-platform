import { Router } from 'express';
import { User } from '../models/index.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/users  — Admin only
router.get('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password', 'twoFactorSecret'] },
      order: [['created_at', 'DESC']],
    });
    res.json(users);
  } catch (err) {
    console.error('Error listing users:', err);
    res.status(500).json({ error: 'Error al listar usuarios' });
  }
});

// GET /api/users/:id
router.get('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password', 'twoFactorSecret'] },
    });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

// PUT /api/users/:id
router.put('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const { fullName, email, role } = req.body;
    await user.update({ fullName, email, role });
    res.json(user.toSafeJSON());
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

// PATCH /api/users/:id/status — Activate/deactivate
router.patch('/:id/status', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    await user.update({ isActive: req.body.isActive });
    res.json({ id: user.id, isActive: user.isActive });
  } catch (err) {
    res.status(500).json({ error: 'Error al cambiar estado' });
  }
});

export default router;
