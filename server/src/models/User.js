import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import bcrypt from 'bcryptjs';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  fullName: {
    type: DataTypes.STRING(150),
    allowNull: false,
    field: 'full_name',
  },
  role: {
    type: DataTypes.ENUM(
      'admin', 'operador_mina', 'tecnico_laboratorio', 'fundidor',
      'transportador', 'comercializador', 'exportador', 'auditor'
    ),
    allowNull: false,
    defaultValue: 'operador_mina',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },
  twoFactorSecret: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'two_factor_secret',
  },
  twoFactorEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'two_factor_enabled',
  },
}, {
  tableName: 'users',
  underscored: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
  },
});

User.prototype.validatePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

User.prototype.toSafeJSON = function () {
  const values = { ...this.get() };
  delete values.password;
  delete values.twoFactorSecret;
  return values;
};

export default User;
