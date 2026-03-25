import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Bar = sequelize.define('Bar', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  barCode: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true,
    field: 'bar_code',
  },
  barNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'bar_number',
  },
  weightGrams: {
    type: DataTypes.DECIMAL(12, 3),
    allowNull: false,
    field: 'weight_grams',
  },
  purityPercent: {
    type: DataTypes.DECIMAL(6, 3),
    allowNull: false,
    field: 'purity_percent',
    comment: 'Purity as percentage (e.g. 99.5)',
  },
  smelterId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'smelter_id',
    references: { model: 'users', key: 'id' },
  },
  smeltDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'smelt_date',
  },
  hasWeightAlert: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'has_weight_alert',
  },
  alertMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'alert_message',
  },
  observations: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'bars',
  underscored: true,
});

export default Bar;
