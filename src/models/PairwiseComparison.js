const { DataTypes } = require('sequelize');
const sequelize = require('../../config/config');

const PairwiseComparison = sequelize.define('PairwiseComparison', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  criteria_id_1: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  criteria_id_2: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  value: {
    type: DataTypes.FLOAT,
    allowNull: false
  }
}, {
  tableName: 'pairwise_comparisons',
  timestamps: true,
  underscored: true
});

module.exports = PairwiseComparison;
