import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const BarSourceLot = sequelize.define('BarSourceLot', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  barId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'bar_id',
    references: { model: 'bars', key: 'id' },
  },
  lotId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'lot_id',
    references: { model: 'lots', key: 'id' },
  },
}, {
  tableName: 'bar_source_lots',
  underscored: true,
  timestamps: false,
});

export default BarSourceLot;
