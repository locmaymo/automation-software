const sequelize = require('../config/database');
const Proxy = require('./Proxy');
const Profile = require('./Profile');
const Script = require('./Script');
const BrowserSession = require('./BrowserSession');

// Define associations
Profile.belongsTo(Proxy, { foreignKey: 'proxyId', as: 'proxy' });
Proxy.hasMany(Profile, { foreignKey: 'proxyId', as: 'profiles' });

BrowserSession.belongsTo(Profile, { foreignKey: 'profileId', as: 'profile' });
Profile.hasMany(BrowserSession, { foreignKey: 'profileId', as: 'sessions' });

module.exports = {
  sequelize,
  Proxy,
  Profile,
  Script,
  BrowserSession,
};

