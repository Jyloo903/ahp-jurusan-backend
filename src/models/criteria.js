const { DataTypes } = require('sequelize');
const sequelize = require('../../config/config');

const Criteria = sequelize.define('Criteria', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  weight: {
    type: DataTypes.FLOAT,
    allowNull: true
  }
}, {
  tableName: 'criteria',
  timestamps: true,
  underscored: true
});

module.exports = Criteria;
