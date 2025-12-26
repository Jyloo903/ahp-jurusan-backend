// src/controllers/recommendationRunController.js
const RecommendationRun = require('../models/recommendationRun');
const Criteria = require('../models/criteria');
const Alternative = require('../models/alternative');
const PairwiseComparison = require('../models/PairwiseComparison');
const AlternativeComparison = require('../models/alternativeComparison');
const { calculateCompleteAHP } = require('../utils/ahpHelper');

exports.runAHP = async (req, res) => {
  try {
    const userId = req.user.id;

    const criteria = await Criteria.findAll({ order: [['i-d', 'ASC']] });
    const alternatives = await Alternative.findAll({ order: [['id', 'ASC']] });

    const criteriaComparisons = await PairwiseComparison.findAll({
      where: { user_id: userId }
    });

    const alternativeComparisons = await AlternativeComparison.findAll({
      where: { user_id: userId }
    });

    if (criteriaComparisons.length === 0 || alternativeComparisons.length === 0) {
      return res.status(400).json({
        success: false,
        message: "User belum lengkap melakukan perbandingan"
      });
    }

    const ahpResult = calculateCompleteAHP(
      criteria,
      criteriaComparisons,
      alternatives,
      alternativeComparisons
    );

    const savedRun = await RecommendationRun.create({
      user_id: userId,
      criteria_weights: ahpResult.criteria_weights,
      alternative_weights: ahpResult.alternative_weights_per_criteria,
      final_ranking: ahpResult.final_ranking
    });

    res.json({
      success: true,
      message: 'AHP berhasil dihitung & disimpan',
      result: ahpResult,
      history_id: savedRun.id
    });
  } catch (err) {
    console.error("Run AHP Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

exports.getMyHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const runs = await RecommendationRun.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      total: runs.length,
      histories: runs
    });
  } catch (err) {
    console.error('MyHistory Error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
