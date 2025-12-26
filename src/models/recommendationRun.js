const { DataTypes } = require('sequelize');
const sequelize = require('../../config/config');

const RecommendationRun = sequelize.define('RecommendationRun', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },

  user_id: { type: DataTypes.BIGINT, allowNull: false },

  criteria_weights: { type: DataTypes.JSON, allowNull: false },
  alternative_weights: { type: DataTypes.JSON, allowNull: false },
  final_ranking: { type: DataTypes.JSON, allowNull: false }

}, {
  tableName: 'recommendation_runs',
  timestamps: true,
  underscored: true,
});

module.exports = RecommendationRun;
