import User from './User.js';
import Lot from './Lot.js';
import Sample from './Sample.js';
import Bar from './Bar.js';
import BarSourceLot from './BarSourceLot.js';
import CustodyTransfer from './CustodyTransfer.js';
import HashRecord from './HashRecord.js';
import AuditLog from './AuditLog.js';
import sequelize from '../config/database.js';

// ─── Lot associations ───
Lot.belongsTo(User, { as: 'operator', foreignKey: 'operator_id' });
Lot.belongsTo(User, { as: 'currentCustodian', foreignKey: 'current_custodian_id' });
Lot.hasMany(Sample, { as: 'samples', foreignKey: 'lot_id' });
Lot.hasMany(CustodyTransfer, { as: 'transfers', foreignKey: 'lot_id' });

// ─── Sample associations ───
Sample.belongsTo(Lot, { as: 'lot', foreignKey: 'lot_id' });
Sample.belongsTo(User, { as: 'technician', foreignKey: 'technician_id' });

// ─── Bar associations ───
Bar.belongsTo(User, { as: 'smelter', foreignKey: 'smelter_id' });
Bar.belongsToMany(Lot, { through: BarSourceLot, as: 'sourceLots', foreignKey: 'bar_id', otherKey: 'lot_id' });
Lot.belongsToMany(Bar, { through: BarSourceLot, as: 'bars', foreignKey: 'lot_id', otherKey: 'bar_id' });

// ─── CustodyTransfer associations ───
CustodyTransfer.belongsTo(User, { as: 'sender', foreignKey: 'sender_id' });
CustodyTransfer.belongsTo(User, { as: 'receiver', foreignKey: 'receiver_id' });
CustodyTransfer.belongsTo(Lot, { as: 'lot', foreignKey: 'lot_id' });
CustodyTransfer.belongsTo(Bar, { as: 'bar', foreignKey: 'bar_id' });

// ─── HashRecord associations ───
HashRecord.belongsTo(User, { as: 'user', foreignKey: 'user_id' });

// ─── AuditLog associations ───
AuditLog.belongsTo(User, { as: 'user', foreignKey: 'user_id' });

// ─── User reverse associations ───
User.hasMany(Lot, { as: 'operatedLots', foreignKey: 'operator_id' });
User.hasMany(Sample, { as: 'samples', foreignKey: 'technician_id' });
User.hasMany(Bar, { as: 'smeltedBars', foreignKey: 'smelter_id' });
User.hasMany(AuditLog, { as: 'auditLogs', foreignKey: 'user_id' });

export {
  sequelize,
  User,
  Lot,
  Sample,
  Bar,
  BarSourceLot,
  CustodyTransfer,
  HashRecord,
  AuditLog,
};
