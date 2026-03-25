import { Router } from 'express';
import { Op, fn, col, literal } from 'sequelize';
import { Lot, Bar, Sample, CustodyTransfer, HashRecord, AuditLog, User } from '../models/index.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { verifyChain } from '../utils/hashChain.js';
import { generateProductionReport } from '../utils/pdfGenerator.js';

const router = Router();

// GET /api/audit/verify — Verify hash chain integrity
router.get('/verify', authenticate, requireRole('admin', 'auditor'), async (req, res) => { // Verifica que el usuario esté autenticado y tenga el rol de admin o auditor
  try {
    const { entityType, entityId } = req.query; // Obtiene el tipo de entidad y el id de la entidad
    const result = await verifyChain(entityType || null, entityId || null); // Verifica la cadena de integridad
    res.json(result); // Retorna el resultado de la verificación
  } catch (err) {
    console.error('Error verifying chain:', err);
    res.status(500).json({ error: 'Error al verificar cadena de integridad' });
  }
});

// GET /api/audit/logs — Query audit logs
router.get('/logs', authenticate, requireRole('admin', 'auditor'), async (req, res) => { 
  try {
    const page = parseInt(req.query.page) || 1; // Obtiene el número de página
    const limit = parseInt(req.query.limit) || 50; // Obtiene el límite de registros por página
    const offset = (page - 1) * limit; // Calcula el offset

    const where = {}; // Objeto para filtrar los registros
    if (req.query.userId) where.userId = req.query.userId; // Filtra por id de usuario
    if (req.query.action) where.action = { [Op.iLike]: `%${req.query.action}%` }; // Filtra por acción
    if (req.query.entityType) where.entityType = req.query.entityType; // Filtra por tipo de entidad

    const { rows, count } = await AuditLog.findAndCountAll({ // Busca y cuenta los registros
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'fullName', 'username'] }],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    res.json({
      logs: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    console.error('Error listing audit logs:', err);
    res.status(500).json({ error: 'Error al listar logs de auditoría' });
  }
});

// GET /api/audit/hash-records — View hash chain records
router.get('/hash-records', authenticate, requireRole('admin', 'auditor'), async (req, res) => { 
  try {
    const page = parseInt(req.query.page) || 1; // Obtiene el número de página
    const limit = parseInt(req.query.limit) || 50; // Obtiene el límite de registros por página
    const offset = (page - 1) * limit; // Calcula el offset

    const { rows, count } = await HashRecord.findAndCountAll({ // Busca y cuenta los registros
      include: [{ model: User, as: 'user', attributes: ['id', 'fullName'] }], // Incluye el usuario
      order: [['sequence_number', 'DESC']], // Ordena por número de secuencia descendente
      limit,
      offset,
    });

    res.json({
      records: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al listar registros de la cadena' });
  }
});

// GET /api/dashboard — Dashboard KPIs
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const activeLots = await Lot.count({ // Cuenta los lotes activos
      where: { status: { [Op.notIn]: ['vendido'] } }, // Filtra por lotes no vendidos
    });

    const goldInTransit = await Lot.sum('gross_weight_grams', { // Suma el peso bruto de los lotes en tránsito
      where: { status: 'en_transito' }, // Filtra por lotes en tránsito
    });

    const totalBars = await Bar.count(); // Cuenta las barras

    const pendingAlerts = await CustodyTransfer.count({ // Cuenta las transferencias con alertas de peso
      where: { hasWeightAlert: true }, // Filtra por alertas de peso
    }) + await Bar.count({ // Cuenta las barras con alertas de peso
      where: { hasWeightAlert: true }, // Filtra por alertas de peso
    });

    const recentTransfers = await CustodyTransfer.findAll({
      include: [
        { model: User, as: 'sender', attributes: ['id', 'fullName'] },
        { model: User, as: 'receiver', attributes: ['id', 'fullName'] },
        { model: Lot, as: 'lot', attributes: ['id', 'code'] },
      ],
      order: [['created_at', 'DESC']],
      limit: 5,
    });

    // Monthly production
    const startOfMonth = new Date(); // Obtiene la fecha actual
    startOfMonth.setDate(1); // Establece el primer día del mes
    startOfMonth.setHours(0, 0, 0, 0); // Establece la hora a 00:00:00

    const monthlyLots = await Lot.count({ // Cuenta los lotes
      where: { createdAt: { [Op.gte]: startOfMonth } }, // Filtra por lotes creados desde el primer día del mes
    });

    const monthlyGrossWeight = await Lot.sum('gross_weight_grams', { // Suma el peso bruto de los lotes
      where: { createdAt: { [Op.gte]: startOfMonth } }, // Filtra por lotes creados desde el primer día del mes
    });

    res.json({
      activeLots,
      goldInTransitGrams: goldInTransit || 0,
      totalBars,
      pendingAlerts,
      recentTransfers,
      monthly: {
        lots: monthlyLots,
        grossWeightGrams: monthlyGrossWeight || 0,
      },
    });
  } catch (err) {
    console.error('Error loading dashboard:', err);
    res.status(500).json({ error: 'Error al cargar dashboard' });
  }
});

// GET /api/reports/production — Monthly production report PDF
router.get('/reports/production', authenticate, requireRole('admin', 'auditor'), async (req, res) => {
  try {
    const { month, year } = req.query;
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();

    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);

    const lots = await Lot.findAll({
      where: { createdAt: { [Op.between]: [startDate, endDate] } },
      include: [{ model: Sample, as: 'samples' }],
      order: [['created_at', 'ASC']],
    });

    const bars = await Bar.findAll({
      where: { createdAt: { [Op.between]: [startDate, endDate] } },
    });

    const transfers = await CustodyTransfer.findAll({
      where: { createdAt: { [Op.between]: [startDate, endDate] } },
    });

    let totalGrossWeight = 0;
    let totalFineGold = 0;
    const lotData = lots.map(l => {
      const gross = parseFloat(l.grossWeightGrams);
      totalGrossWeight += gross;
      let fineGold = 0;
      if (l.samples) {
        fineGold = l.samples.reduce((sum, s) => sum + parseFloat(s.fineGoldGrams), 0);
      }
      totalFineGold += fineGold;
      return {
        code: l.code,
        mineName: l.mineName,
        grossWeightGrams: gross.toFixed(3),
        fineGold: fineGold.toFixed(6),
        status: l.status,
      };
    });

    const period = `${String(m).padStart(2, '0')}/${y}`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=reporte-produccion-${period.replace('/', '-')}.pdf`);

    generateProductionReport({
      period,
      totalLots: lots.length,
      totalGrossWeight: totalGrossWeight.toFixed(3),
      totalFineGold: totalFineGold.toFixed(6),
      totalBars: bars.length,
      totalTransfers: transfers.length,
      lots: lotData,
    }, res);
  } catch (err) {
    console.error('Error generating report:', err);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
});

export default router;
