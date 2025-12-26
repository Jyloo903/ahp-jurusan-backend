// src/controllers/pairwiseController.js
const PairwiseComparison = require('../models/PairwiseComparison');
const Criteria = require('../models/criteria');

// ====================== SAVE ======================
exports.savePairwiseComparisons = async (req, res) => {
  try {
    const { comparisons } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(comparisons)) {
      return res.status(400).json({
        success: false,
        message: "Comparisons must be an array"
      });
    }

    // Hapus data lama user
    await PairwiseComparison.destroy({
      where: { user_id: userId }
    });

    const saved = [];
    for (const comp of comparisons) {
      const { criteria_id_1, criteria_id_2, value } = comp;

      if (!criteria_id_1 || !criteria_id_2 || value === undefined) continue;

      const row = await PairwiseComparison.create({
        user_id: userId,
        criteria_id_1,
        criteria_id_2,
        value: parseFloat(value)
      });

      saved.push(row);
    }

    return res.json({
      success: true,
      message: "Pairwise comparisons saved successfully",
      data: saved
    });

  } catch (err) {
    console.error("SAVE PAIRWISE ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};


// ====================== GET ALL ======================
exports.getPairwiseComparisons = async (req, res) => {
  try {
    const userId = req.user.id;

    const rows = await PairwiseComparison.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Criteria,
          as: 'Criteria1',
          attributes: ['id', 'name']
        },
        {
          model: Criteria,
          as: 'Criteria2',
          attributes: ['id', 'name']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return res.json({
      success: true,
      data: rows
    });

  } catch (err) {
    console.error("GET PAIRWISE ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error retrieving comparisons",
      error: err.message
    });
  }
};


// ====================== GET BY ID ======================
exports.getComparisonById = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = req.params.id;

    const row = await PairwiseComparison.findOne({
      where: { id, user_id: userId },
      include: [
        { model: Criteria, as: 'Criteria1', attributes: ['id', 'name'] },
        { model: Criteria, as: 'Criteria2', attributes: ['id', 'name'] }
      ]
    });

    if (!row)
      return res.status(404).json({ success: false, message: "Not found" });

    return res.json({ success: true, data: row });

  } catch (err) {
    console.error("GET BY ID ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};


// ====================== DELETE ======================
exports.deleteComparison = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = req.params.id;

    const deleted = await PairwiseComparison.destroy({
      where: { id, user_id: userId }
    });

    if (!deleted)
      return res.status(404).json({ success: false, message: "Not found" });

    return res.json({
      success: true,
      message: "Comparison deleted"
    });

  } catch (err) {
    console.error("DELETE ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};
