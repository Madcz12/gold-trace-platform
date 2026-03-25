import { Router } from 'express';
import { CustodyTransfer, Lot, Bar, User } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';
import { auditMiddleware } from '../middleware/audit.js';
import { addHashRecord } from '../utils/hashChain.js';
import { generateTransferGuide } from '../utils/pdfGenerator.js';
import { TRANSFER_TOLERANCE_PCT } from '../config/constants.js';

const router = Router();

// POST /api/transfers — Register custody transfer
router.post('/', authenticate, auditMiddleware('transfer_initiated', 'transfer'), async (req, res) => {
  try {
    const {
      lotId, barId, receiverId, weightGrams,
      latitude, longitude, observations,
    } = req.body;

    if (!receiverId || !weightGrams || (!lotId && !barId)) {
      return res.status(400).json({ error: 'Receptor, peso y lote o barra son requeridos' });
    }

    // RF-17: Validate the sender has custody
    if (lotId) {
      const lot = await Lot.findByPk(lotId);
      if (!lot) return res.status(404).json({ error: 'Lote no encontrado' });
      if (lot.currentCustodianId !== req.user.id) {
        return res.status(403).json({ error: 'Solo el custodio actual puede transferir este lote' });
      }
    }

    // RF-24: Check weight discrepancy
    let hasWeightAlert = false;
    let alertMessage = null;

    if (lotId) {
      const previousTransfer = await CustodyTransfer.findOne({
        where: { lotId },
        order: [['created_at', 'DESC']],
      });

      const referenceWeight = previousTransfer
        ? parseFloat(previousTransfer.weightGrams)
        : parseFloat((await Lot.findByPk(lotId)).grossWeightGrams);

      const tolerance = TRANSFER_TOLERANCE_PCT / 100;
      const diff = Math.abs(parseFloat(weightGrams) - referenceWeight) / referenceWeight;

      if (diff > tolerance) {
        hasWeightAlert = true;
        alertMessage = `ALERTA: Diferencia de peso del ${(diff * 100).toFixed(2)}% respecto al registro anterior (${referenceWeight}g → ${weightGrams}g). Tolerancia: ±${TRANSFER_TOLERANCE_PCT}%.`;
      }
    }

    const transfer = await CustodyTransfer.create({
      lotId: lotId || null,
      barId: barId || null,
      senderId: req.user.id,
      receiverId,
      weightGrams,
      latitude: latitude || null,
      longitude: longitude || null,
      senderSignature: `signed:${req.user.id}:${Date.now()}`,
      status: 'pendiente',
      hasWeightAlert,
      alertMessage,
      observations: observations || null,
    });

    // Update lot custodian and status
    if (lotId) {
      await Lot.update(
        { currentCustodianId: receiverId, status: 'en_transito' },
        { where: { id: lotId } }
      );
    }

    // Hash chain
    await addHashRecord('transfer', transfer.id, 'transfer_initiated', {
      lotId, barId,
      senderId: req.user.id,
      receiverId,
      weightGrams,
      hasWeightAlert,
    }, req.user.id);

    res.status(201).json(transfer);
  } catch (err) {
    console.error('Error creating transfer:', err);
    res.status(500).json({ error: 'Error al registrar traspaso' });
  }
});

// PATCH /api/transfers/:id/sign — Receiver signs the transfer
router.patch('/:id/sign', authenticate, auditMiddleware('transfer_signed', 'transfer'), async (req, res) => {
  try {
    const transfer = await CustodyTransfer.findByPk(req.params.id);
    if (!transfer) return res.status(404).json({ error: 'Traspaso no encontrado' });

    if (transfer.receiverId !== req.user.id) {
      return res.status(403).json({ error: 'Solo el receptor puede firmar este traspaso' });
    }

    await transfer.update({
      receiverSignature: `signed:${req.user.id}:${Date.now()}`,
      status: 'completado',
    });

    // Update lot status
    if (transfer.lotId) {
      await Lot.update({ status: 'entregado' }, { where: { id: transfer.lotId } });
    }

    // Hash chain
    await addHashRecord('transfer', transfer.id, 'transfer_completed', {
      transferId: transfer.id,
      receiverId: req.user.id,
    }, req.user.id);

    res.json(transfer);
  } catch (err) {
    res.status(500).json({ error: 'Error al firmar traspaso' });
  }
});

// GET /api/transfers — List all transfers
router.get('/', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { rows, count } = await CustodyTransfer.findAndCountAll({
      include: [
        { model: User, as: 'sender', attributes: ['id', 'fullName', 'username'] },
        { model: User, as: 'receiver', attributes: ['id', 'fullName', 'username'] },
        { model: Lot, as: 'lot', attributes: ['id', 'code', 'mineName'] },
        { model: Bar, as: 'bar', attributes: ['id', 'barCode'] },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    res.json({
      transfers: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    console.error('Error listing transfers:', err);
    res.status(500).json({ error: 'Error al listar traspasos' });
  }
});

// GET /api/lots/:lotId/transfers — Custody history for a lot
router.get('/lot/:lotId', authenticate, async (req, res) => {
  try {
    const transfers = await CustodyTransfer.findAll({
      where: { lotId: req.params.lotId },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'fullName'] },
        { model: User, as: 'receiver', attributes: ['id', 'fullName'] },
      ],
      order: [['created_at', 'ASC']],
    });
    res.json(transfers);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener historial de custodia' });
  }
});

// GET /api/transfers/:id/pdf — Mobility guide PDF
router.get('/:id/pdf', authenticate, async (req, res) => {
  try {
    const transfer = await CustodyTransfer.findByPk(req.params.id, {
      include: [
        { model: User, as: 'sender', attributes: ['fullName'] },
        { model: User, as: 'receiver', attributes: ['fullName'] },
        { model: Lot, as: 'lot', attributes: ['code'] },
        { model: Bar, as: 'bar', attributes: ['barCode'] },
      ],
    });

    if (!transfer) return res.status(404).json({ error: 'Traspaso no encontrado' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=guia-${transfer.id}.pdf`);

    generateTransferGuide({
      ...transfer.toJSON(),
      lotCode: transfer.lot?.code,
      barCode: transfer.bar?.barCode,
      senderName: transfer.sender?.fullName,
      receiverName: transfer.receiver?.fullName,
    }, res);
  } catch (err) {
    console.error('Error generating PDF:', err);
    res.status(500).json({ error: 'Error al generar guía PDF' });
  }
});

export default router;
