const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Profile = sequelize.define('Profile', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fingerprint: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  proxyId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'proxies',
      key: 'id',
    },
  },
  userDataDir: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('inactive', 'active', 'error'),
    defaultValue: 'inactive',
  },
  lastUsed: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'profiles',
  timestamps: true,
});

module.exports = Profile;

