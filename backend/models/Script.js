const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Script = sequelize.define('Script', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  actions: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
  },
  schedule: {
    type: DataTypes.STRING, // cron expression
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  lastRun: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  runCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  successCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  failureCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'scripts',
  timestamps: true,
});

module.exports = Script;

