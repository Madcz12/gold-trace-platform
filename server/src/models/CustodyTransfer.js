import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const CustodyTransfer = sequelize.define('CustodyTransfer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  lotId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'lot_id',
    references: { model: 'lots', key: 'id' },
  },
  barId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'bar_id',
    references: { model: 'bars', key: 'id' },
  },
  senderId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'sender_id',
    references: { model: 'users', key: 'id' },
  },
  receiverId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'receiver_id',
    references: { model: 'users', key: 'id' },
  },
  weightGrams: {
    type: DataTypes.DECIMAL(12, 3),
    allowNull: false,
    field: 'weight_grams',
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true,
  },
  longitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true,
  },
  senderSignature: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'sender_signature',
  },
  receiverSignature: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'receiver_signature',
  },
  status: {
    type: DataTypes.ENUM('pendiente', 'firmado', 'completado'),
    defaultValue: 'pendiente',
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
  tableName: 'custody_transfers',
  underscored: true,
});

export default CustodyTransfer;
