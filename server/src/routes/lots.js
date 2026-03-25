import { Router } from 'express';
import { Op } from 'sequelize';
import { Lot, User, Sample, Bar, CustodyTransfer } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';
import { auditMiddleware } from '../middleware/audit.js';
import { generateQR } from '../utils/qrGenerator.js';
import { addHashRecord } from '../utils/hashChain.js';

const router = Router();

/**
 * Generate lot code: AU-YYYY-NNNNN
 */
async function generateLotCode() {
  const year = new Date().getFullYear();
  const prefix = `AU-${year}-`;

  const lastLot = await Lot.findOne({
    where: { code: { [Op.like]: `${prefix}%` } },
    order: [['code', 'DESC']],
  });

  let nextNum = 1;
  if (lastLot) {
    const lastNum = parseInt(lastLot.code.split('-')[2], 10);
    nextNum = lastNum + 1;
  }

  return `${prefix}${String(nextNum).padStart(5, '0')}`;
}

// POST /api/lots — Create new lot
router.post('/', authenticate, auditMiddleware('lot_created', 'lot'), async (req, res) => {
  try {
    const {
      extractionDate, latitude, longitude, mineName,
      grossWeightGrams, workShift, observations,
    } = req.body;

    if (!extractionDate || !mineName || !grossWeightGrams) {
      return res.status(400).json({ error: 'Fecha de extracción, nombre de mina y peso bruto son requeridos' });
    }

    const code = await generateLotCode();
    const qrData = JSON.stringify({ code, type: 'lot', url: `/lots/${code}` });
    const qrCode = await generateQR(qrData);

    const lot = await Lot.create({
      code,
      extractionDate,
      latitude,
      longitude,
      mineName,
      operatorId: req.user.id,
      grossWeightGrams,
      workShift,
      observations,
      qrCode,
      currentCustodianId: req.user.id,
    });

    // Add to hash chain
    await addHashRecord('lot', lot.id, 'lot_created', {
      code: lot.code,
      mineName: lot.mineName,
      grossWeightGrams: lot.grossWeightGrams,
      operatorId: lot.operatorId,
      extractionDate: lot.extractionDate,
    }, req.user.id);

    res.status(201).json(lot);
  } catch (err) {
    console.error('Error creating lot:', err);
    res.status(500).json({ error: 'Error al crear lote' });
  }
});

// GET /api/lots — List lots with pagination
router.get('/', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';

    const where = {};
    if (search) {
      where[Op.or] = [
        { code: { [Op.iLike]: `%${search}%` } },
        { mineName: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (status) where.status = status;

    const { rows, count } = await Lot.findAndCountAll({
      where,
      include: [
        { model: User, as: 'operator', attributes: ['id', 'fullName', 'username'] },
        { model: User, as: 'currentCustodian', attributes: ['id', 'fullName', 'username'] },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    res.json({
      lots: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    console.error('Error listing lots:', err);
    res.status(500).json({ error: 'Error al listar lotes' });
  }
});

// GET /api/lots/:id — Full lot detail with timeline
router.get('/:id', authenticate, async (req, res) => {
  try {
    const lot = await Lot.findByPk(req.params.id, {
      include: [
        { model: User, as: 'operator', attributes: ['id', 'fullName', 'username'] },
        { model: User, as: 'currentCustodian', attributes: ['id', 'fullName', 'username'] },
        {
          model: Sample, as: 'samples',
          include: [{ model: User, as: 'technician', attributes: ['id', 'fullName'] }],
          order: [['created_at', 'DESC']],
        },
        {
          model: CustodyTransfer, as: 'transfers',
          include: [
            { model: User, as: 'sender', attributes: ['id', 'fullName'] },
            { model: User, as: 'receiver', attributes: ['id', 'fullName'] },
          ],
          order: [['created_at', 'DESC']],
        },
        {
          model: Bar, as: 'bars',
          through: { attributes: [] },
        },
      ],
    });

    if (!lot) return res.status(404).json({ error: 'Lote no encontrado' });

    // Calculate weighted average fine gold from samples
    let totalFineGold = 0;
    if (lot.samples && lot.samples.length > 0) {
      totalFineGold = lot.samples.reduce((sum, s) => sum + parseFloat(s.fineGoldGrams), 0);
    }

    res.json({
      ...lot.toJSON(),
      estimatedFineGold: totalFineGold,
    });
  } catch (err) {
    console.error('Error getting lot:', err);
    res.status(500).json({ error: 'Error al obtener lote' });
  }
});

// GET /api/lots/:id/qr — QR code image
router.get('/:id/qr', authenticate, async (req, res) => {
  try {
    const lot = await Lot.findByPk(req.params.id, { attributes: ['id', 'code', 'qrCode'] });
    if (!lot) return res.status(404).json({ error: 'Lote no encontrado' });
    res.json({ code: lot.code, qrCode: lot.qrCode });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener QR' });
  }
});

export default router;
