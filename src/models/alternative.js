const { DataTypes } = require('sequelize');
const sequelize = require('../../config/config');

const Alternative = sequelize.define('Alternative', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'alternatives',
  timestamps: true,
  underscored: true
});

module.exports = Alternative;
