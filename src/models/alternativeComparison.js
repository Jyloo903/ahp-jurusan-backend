const { DataTypes } = require('sequelize');
const sequelize = require('../../config/config');

const AlternativeComparison = sequelize.define('AlternativeComparison', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },

  user_id: { type: DataTypes.BIGINT, allowNull: false },

  criteria_id: { type: DataTypes.BIGINT, allowNull: false },

  alternative_id_1: { type: DataTypes.BIGINT, allowNull: false },
  alternative_id_2: { type: DataTypes.BIGINT, allowNull: false },

  value: { type: DataTypes.FLOAT, allowNull: false }
}, {
  tableName: 'alternative_comparisons',
  timestamps: true,
  underscored: true,
});

module.exports = AlternativeComparison;
