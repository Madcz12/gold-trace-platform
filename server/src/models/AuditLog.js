import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: { model: 'users', key: 'id' },
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  entityType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'entity_type',
  },
  entityId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'entity_id',
  },
  details: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true,
    field: 'ip_address',
  },
}, {
  tableName: 'audit_logs',
  underscored: true,
  updatedAt: false,
});

export default AuditLog;
