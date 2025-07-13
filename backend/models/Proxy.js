const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Proxy = sequelize.define('Proxy', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  host: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  port: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  protocol: {
    type: DataTypes.STRING,
    defaultValue: 'http',
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('untested', 'working', 'failed'),
    defaultValue: 'untested',
  },
  speed: {
    type: DataTypes.INTEGER, // milliseconds
    allowNull: true,
  },
  lastTested: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  isAssigned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  assignedTo: {
    type: DataTypes.INTEGER, // Profile ID
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'proxies',
  timestamps: true,
});

module.exports = Proxy;

