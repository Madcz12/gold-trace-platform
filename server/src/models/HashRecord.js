import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const HashRecord = sequelize.define('HashRecord', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  sequenceNumber: {
    type: DataTypes.BIGINT,
    allowNull: false,
    autoIncrement: true,
    unique: true,
    field: 'sequence_number',
  },
  entityType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'entity_type',
    comment: 'lot, sample, bar, transfer',
  },
  entityId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'entity_id',
  },
  action: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  dataHash: {
    type: DataTypes.STRING(64),
    allowNull: false,
    field: 'data_hash',
    comment: 'SHA-256 hash of the data payload',
  },
  previousHash: {
    type: DataTypes.STRING(64),
    allowNull: true,
    field: 'previous_hash',
    comment: 'Hash of the previous record in the chain',
  },
  combinedHash: {
    type: DataTypes.STRING(64),
    allowNull: false,
    field: 'combined_hash',
    comment: 'SHA-256(previousHash + dataHash)',
  },
  payload: {
    type: DataTypes.JSONB,
    allowNull: false,
    comment: 'The original data that was hashed',
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: { model: 'users', key: 'id' },
  },
}, {
  tableName: 'hash_records',
  underscored: true,
  updatedAt: false,
  indexes: [
    { fields: ['entity_type', 'entity_id'] },
    { fields: ['sequence_number'] },
  ],
});

export default HashRecord;
