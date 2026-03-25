import { Router } from 'express';
import { Sample, Lot, User } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';
import { auditMiddleware } from '../middleware/audit.js';
import { addHashRecord } from '../utils/hashChain.js';

const router = Router();

// POST /api/lots/:lotId/samples — Add a sample to a lot
router.post('/:lotId/samples', authenticate, auditMiddleware('sample_added', 'sample'), async (req, res) => {
  try {
    const lot = await Lot.findByPk(req.params.lotId);
    if (!lot) return res.status(404).json({ error: 'Lote no encontrado' });

    const {
      dryWeightGrams, moisturePercent, gradeGramsPerTon,
      labCertificateUrl, observations,
    } = req.body;

    if (!dryWeightGrams || !gradeGramsPerTon) {
      return res.status(400).json({ error: 'Peso seco y ley del mineral son requeridos' });
    }

    // RF-07: Automatically calculate fine gold content
    // fineGold = dryWeight (grams) × grade (g/ton) / 1,000,000
    const fineGoldGrams = (parseFloat(dryWeightGrams) * parseFloat(gradeGramsPerTon)) / 1000000;

    const sample = await Sample.create({
      lotId: lot.id,
      dryWeightGrams,
      moisturePercent: moisturePercent || null,
      gradeGramsPerTon,
      fineGoldGrams,
      labCertificateUrl: labCertificateUrl || null,
      technicianId: req.user.id,
      observations: observations || null,
    });

    // Update lot status
    if (lot.status === 'registrado') {
      await lot.update({ status: 'muestreado' });
    }

    // Hash chain
    await addHashRecord('sample', sample.id, 'sample_added', {
      lotId: lot.id,
      lotCode: lot.code,
      dryWeightGrams,
      gradeGramsPerTon,
      fineGoldGrams,
    }, req.user.id);

    res.status(201).json(sample);
  } catch (err) {
    console.error('Error creating sample:', err);
    res.status(500).json({ error: 'Error al registrar muestra' });
  }
});

// GET /api/lots/:lotId/samples — List samples for a lot
router.get('/:lotId/samples', authenticate, async (req, res) => {
  try {
    const lot = await Lot.findByPk(req.params.lotId);
    if (!lot) return res.status(404).json({ error: 'Lote no encontrado' });

    const samples = await Sample.findAll({
      where: { lotId: lot.id },
      include: [{ model: User, as: 'technician', attributes: ['id', 'fullName', 'username'] }],
      order: [['created_at', 'DESC']],
    });

    // RF-10: Calculate weighted average
    let totalFineGold = 0;
    let totalWeight = 0;
    for (const s of samples) {
      totalFineGold += parseFloat(s.fineGoldGrams);
      totalWeight += parseFloat(s.dryWeightGrams);
    }

    const avgGrade = totalWeight > 0
      ? (totalFineGold / totalWeight) * 1000000
      : 0;

    res.json({
      samples,
      summary: {
        count: samples.length,
        totalFineGoldGrams: totalFineGold.toFixed(6),
        totalDryWeightGrams: totalWeight.toFixed(3),
        weightedAverageGrade: avgGrade.toFixed(4),
      },
    });
  } catch (err) {
    console.error('Error listing samples:', err);
    res.status(500).json({ error: 'Error al listar muestras' });
  }
});

export default router;
