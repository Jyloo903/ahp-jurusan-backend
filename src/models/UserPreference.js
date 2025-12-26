// src/models/UserPreference.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/config');

const UserPreference = sequelize.define('UserPreference', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  alternative_id: {      // PASTIKAN ADA INI
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  criteria_id: {         // PASTIKAN ADA INI
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  score: {              // PASTIKAN ADA INI
    type: DataTypes.FLOAT,
    allowNull: false,
  }
}, {
  tableName: 'user_preferences',
  timestamps: true,
  underscored: true,
});

module.exports = UserPreference;