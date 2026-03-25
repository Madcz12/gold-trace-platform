import { Router } from 'express';
import { Bar, Lot, Sample, BarSourceLot, User } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';
import { auditMiddleware } from '../middleware/audit.js';
import { addHashRecord } from '../utils/hashChain.js';
import { WEIGHT_TOLERANCE_PCT } from '../config/constants.js';

const router = Router();

/**
 * Generate bar code: BAR-YYYY-NNNNN
 */
async function generateBarCode() {
  const year = new Date().getFullYear();
  const prefix = `BAR-${year}-`;
  const { Op } = await import('sequelize');

  const lastBar = await Bar.findOne({
    where: { barCode: { [Op.like]: `${prefix}%` } },
    order: [['bar_code', 'DESC']],
  });

  let nextNum = 1;
  if (lastBar) {
    const lastNum = parseInt(lastBar.barCode.split('-')[2], 10);
    nextNum = lastNum + 1;
  }

  return `${prefix}${String(nextNum).padStart(5, '0')}`;
}

// POST /api/bars — Create bar from lots
router.post('/', authenticate, auditMiddleware('bar_produced', 'bar'), async (req, res) => {
  try {
    const {
      lotIds, weightGrams, purityPercent, barNumber,
      smeltDate, observations,
    } = req.body;

    if (!lotIds || !lotIds.length || !weightGrams || !purityPercent || !barNumber || !smeltDate) {
      return res.status(400).json({ error: 'Lotes de origen, peso, pureza, número de barra y fecha son requeridos' });
    }

    // Get source lots and their estimated fine gold
    const sourceLots = await Lot.findAll({ where: { id: lotIds } });
    if (sourceLots.length !== lotIds.length) {
      return res.status(400).json({ error: 'Uno o más lotes no fueron encontrados' });
    }

    // Calculate total estimated fine gold from samples
    let estimatedFineGold = 0;
    for (const lot of sourceLots) {
      const samples = await Sample.findAll({ where: { lotId: lot.id } });
      for (const s of samples) {
        estimatedFineGold += parseFloat(s.fineGoldGrams);
      }
    }

    // RF-14: Alert if bar weight exceeds estimated fine gold
    let hasWeightAlert = false;
    let alertMessage = null;
    const tolerance = WEIGHT_TOLERANCE_PCT / 100;
    const maxAllowed = estimatedFineGold * (1 + tolerance);

    if (parseFloat(weightGrams) > maxAllowed && estimatedFineGold > 0) {
      hasWeightAlert = true;
      alertMessage = `ALERTA: El peso de la barra (${weightGrams}g) supera el oro fino estimado (${estimatedFineGold.toFixed(3)}g) por más del ${WEIGHT_TOLERANCE_PCT}% de tolerancia.`;
    }

    const barCode = await generateBarCode();

    const bar = await Bar.create({
      barCode,
      barNumber,
      weightGrams,
      purityPercent,
      smelterId: req.user.id,
      smeltDate,
      hasWeightAlert,
      alertMessage,
      observations: observations || null,
    });

    // Create junction records
    for (const lotId of lotIds) {
      await BarSourceLot.create({ barId: bar.id, lotId });
      // Update lot status
      await Lot.update({ status: 'fundido' }, { where: { id: lotId } });
    }

    // Hash chain
    await addHashRecord('bar', bar.id, 'bar_produced', {
      barCode: bar.barCode,
      weightGrams: bar.weightGrams,
      purityPercent: bar.purityPercent,
      sourceLotIds: lotIds,
      hasWeightAlert,
    }, req.user.id);

    res.status(201).json({
      ...bar.toJSON(),
      sourceLots: sourceLots.map(l => ({ id: l.id, code: l.code })),
    });
  } catch (err) {
    console.error('Error creating bar:', err);
    res.status(500).json({ error: 'Error al registrar barra' });
  }
});

// GET /api/bars
router.get('/', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { rows, count } = await Bar.findAndCountAll({
      include: [
        { model: User, as: 'smelter', attributes: ['id', 'fullName', 'username'] },
        { model: Lot, as: 'sourceLots', through: { attributes: [] }, attributes: ['id', 'code', 'mineName'] },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    res.json({
      bars: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    console.error('Error listing bars:', err);
    res.status(500).json({ error: 'Error al listar barras' });
  }
});

// GET /api/bars/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const bar = await Bar.findByPk(req.params.id, {
      include: [
        { model: User, as: 'smelter', attributes: ['id', 'fullName', 'username'] },
        { model: Lot, as: 'sourceLots', through: { attributes: [] } },
      ],
    });
    if (!bar) return res.status(404).json({ error: 'Barra no encontrada' });
    res.json(bar);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener barra' });
  }
});

export default router;
