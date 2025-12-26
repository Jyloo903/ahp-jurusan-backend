// src/controllers/ahpController.js
const Pairwise = require('../models/PairwiseComparison');
const Criteria = require('../models/criteria');
const Alternative = require('../models/alternative');
const UserPreference = require('../models/UserPreference');
const RecommendationRun = require('../models/recommendationRun');

// =============== NORMALIZATION ===================
function normalizeMatrix(matrix) {
  const n = matrix.length;
  const colSum = Array(n).fill(0);

  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++)
      colSum[j] += matrix[i][j];

  return matrix.map(row =>
    row.map((val, j) => val / colSum[j])
  );
}

// ============= PRIORITY VECTOR ===================
function calculatePriorityVector(norm) {
  return norm.map(row => {
    const sum = row.reduce((a, b) => a + b, 0);
    return sum / row.length;
  });
}

// ================ CONSISTENCY ======================
function calculateCR(matrix, weights) {
  const n = weights.length;

  const weightedSum = matrix.map(row =>
    row.reduce((sum, val, j) => sum + val * weights[j], 0)
  );

  const lambdaMax =
    weightedSum.reduce((a, val, i) => a + val / weights[i], 0) / n;

  const CI = (lambdaMax - n) / (n - 1);
  const RI = { 1: 0, 2: 0, 3: 0.58, 4: 0.9, 5: 1.12, 6: 1.24, 7: 1.32, 8: 1.41 }[n] || 1.45;
  const CR = CI / RI;

  return { CI, CR, lambdaMax };
}

// ===================================================
//                    MAIN AHP (FIXED VERSION)
// ===================================================
exports.calculateAHP = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Get all criteria
    const criteria = await Criteria.findAll({ order: [['id', 'ASC']] });
    const n = criteria.length;

    if (n < 2)
      return res.status(400).json({ success: false, message: "Minimal 2 criteria" });

    // 2. Get user's pairwise comparisons
    const comp = await Pairwise.findAll({ where: { user_id: userId } });

    if (!comp.length)
      return res.status(400).json({ success: false, message: "No pairwise comparison data. Please compare criteria first." });

    // 3. Build pairwise comparison matrix NxN
    const matrix = Array.from({ length: n }, () => Array(n).fill(1));

    comp.forEach(c => {
      const i = criteria.findIndex(x => x.id === c.criteria_id_1);
      const j = criteria.findIndex(x => x.id === c.criteria_id_2);

      if (i !== -1 && j !== -1) {
        matrix[i][j] = c.value;
        matrix[j][i] = 1 / c.value;
      }
    });

    // 4. Normalize matrix
    const normalized = normalizeMatrix(matrix);

    // 5. Calculate priority vector (criteria weights)
    const weights = calculatePriorityVector(normalized);

    // 6. Check consistency
    const { CI, CR, lambdaMax } = calculateCR(matrix, weights);

    // 7. Get user preferences (alternative scores per criteria)
    const prefs = await UserPreference.findAll({
      where: { user_id: userId }
    });

    if (!prefs.length)
      return res.status(400).json({ success: false, message: "No preference data. Please rate alternatives first." });

    // 8. Get all alternatives
    const alternatives = await Alternative.findAll({});
    const altScores = {};

    // Initialize scores for each alternative
    alternatives.forEach(alt => {
      altScores[alt.id] = {
        id: alt.id,
        name: alt.name,
        total: 0
      };
    });

    // 9. Calculate weighted scores for each alternative
    prefs.forEach(pref => {
      const alt = altScores[pref.alternative_id];
      if (!alt) return;

      const idx = criteria.findIndex(c => c.id === pref.criteria_id);
      if (idx === -1 || typeof weights[idx] !== "number") return;

      alt.total += weights[idx] * Number(pref.score || 0);
    });

    // 10. Create ranking (sort by total score)
    const ranking = Object.values(altScores)
      .filter(alt => alt.total > 0) // Only include alternatives with scores
      .sort((a, b) => b.total - a.total);

    // 11. Prepare data for saving
    const criteriaWithWeights = criteria.map((c, i) => ({
      id: c.id,
      name: c.name,
      weight: parseFloat(weights[i].toFixed(4))
    }));

    const alternativeWeights = {};
    alternatives.forEach(alt => {
      alternativeWeights[alt.id] = {
        id: alt.id,
        name: alt.name,
        score: altScores[alt.id]?.total || 0
      };
    });

    const finalRanking = ranking.map(item => ({
      id: item.id,
      name: item.name,
      total: parseFloat(item.total.toFixed(4))
    }));

    // 12. Save to recommendation runs (FIXED - sesuai model)
    await RecommendationRun.create({
      user_id: userId,
      criteria_weights: criteriaWithWeights,
      alternative_weights: alternativeWeights,
      final_ranking: finalRanking
    });

    // 13. Return results
    return res.json({
      success: true,
      message: "AHP calculation successful",
      data: {
        criteria: criteriaWithWeights,
        consistency: {
          CI: parseFloat(CI.toFixed(4)),
          CR: parseFloat(CR.toFixed(4)),
          lambdaMax: parseFloat(lambdaMax.toFixed(4)),
          isConsistent: CR <= 0.1
        },
        ranking: finalRanking,
        recommendation: finalRanking.length > 0 ? 
          `Based on your preferences, the recommended major is: ${finalRanking[0].name}` : 
          "No recommendation available"
      }
    });

  } catch (err) {
    console.error("AHP ERROR:", err);
    
    // Provide more specific error messages
    let errorMessage = "AHP calculation failed";
    if (err.name === 'SequelizeValidationError') {
      errorMessage = "Database validation error. Please check if all required fields are provided.";
    } else if (err.name === 'SequelizeDatabaseError') {
      errorMessage = "Database error. Please check table structure.";
    }
    
    return res.status(500).json({
      success: false,
      message: errorMessage,
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};