import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Sample = sequelize.define('Sample', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  lotId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'lot_id',
    references: { model: 'lots', key: 'id' },
  },
  dryWeightGrams: {
    type: DataTypes.DECIMAL(12, 3),
    allowNull: false,
    field: 'dry_weight_grams',
  },
  moisturePercent: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    field: 'moisture_percent',
  },
  gradeGramsPerTon: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: false,
    field: 'grade_grams_per_ton',
    comment: 'Ley del mineral — grams of gold per ton',
  },
  fineGoldGrams: {
    type: DataTypes.DECIMAL(12, 6),
    allowNull: false,
    field: 'fine_gold_grams',
    comment: 'Calculated: dryWeightGrams * gradeGramsPerTon / 1_000_000',
  },
  labCertificateUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'lab_certificate_url',
  },
  technicianId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'technician_id',
    references: { model: 'users', key: 'id' },
  },
  observations: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'samples',
  underscored: true,
});

export default Sample;
