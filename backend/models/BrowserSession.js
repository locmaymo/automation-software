const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BrowserSession = sequelize.define('BrowserSession', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  profileId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'profiles',
      key: 'id',
    },
  },
  pid: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  wsEndpoint: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('starting', 'running', 'stopped', 'error'),
    defaultValue: 'starting',
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  stoppedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  isMaster: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  currentUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  lastActivity: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'browser_sessions',
  timestamps: true,
});

module.exports = BrowserSession;

