import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Lot = sequelize.define('Lot', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  extractionDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'extraction_date',
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true,
  },
  longitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true,
  },
  mineName: {
    type: DataTypes.STRING(150),
    allowNull: false,
    field: 'mine_name',
  },
  operatorId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'operator_id',
    references: { model: 'users', key: 'id' },
  },
  grossWeightGrams: {
    type: DataTypes.DECIMAL(12, 3),
    allowNull: false,
    field: 'gross_weight_grams',
  },
  workShift: {
    type: DataTypes.ENUM('morning', 'afternoon', 'night'),
    allowNull: true,
    field: 'work_shift',
  },
  observations: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('registrado', 'muestreado', 'fundido', 'en_transito', 'entregado', 'vendido'),
    defaultValue: 'registrado',
  },
  qrCode: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'qr_code',
  },
  currentCustodianId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'current_custodian_id',
    references: { model: 'users', key: 'id' },
  },
}, {
  tableName: 'lots',
  underscored: true,
});

export default Lot;
