// src/controllers/alternativeComparisonController.js
const AlternativeComparison = require('../models/alternativeComparison');
const Alternative = require('../models/alternative');
const Criteria = require('../models/criteria');

// Save alternative comparisons for a specific criteria
exports.saveAlternativeComparisons = async (req, res) => {
  try {
    const { criteria_id, comparisons } = req.body; // [{alt1, alt2, value}]
    const userId = req.user.id;

    // Delete existing comparisons for this user & criteria
    await AlternativeComparison.destroy({ 
      where: { 
        user_id: userId,
        criteria_id: criteria_id
      } 
    });

    // Save new comparisons
    const comparisonData = comparisons.map(comp => ({
      user_id: userId,
      criteria_id: criteria_id,
      alternative_id_1: comp.alternative_id_1,
      alternative_id_2: comp.alternative_id_2,
      value: comp.value
    }));

    await AlternativeComparison.bulkCreate(comparisonData);

    res.json({
      success: true,
      message: 'Alternative comparisons saved successfully',
      data: {
        criteria_id: criteria_id,
        comparisons: comparisonData.length
      }
    });
  } catch (error) {
    console.error('Save alternative comparisons error:', error);
    res.status(500).json({ success: false, message: 'Failed to save comparisons' });
  }
};

// Get alternative comparisons for a user
exports.getUserAlternativeComparisons = async (req, res) => {
  try {
    const userId = req.user.id;
    const { criteria_id } = req.query;
    
    const whereClause = { user_id: userId };
    if (criteria_id) whereClause.criteria_id = criteria_id;

    const comparisons = await AlternativeComparison.findAll({
      where: whereClause,
      include: [
        { 
          model: Alternative, 
          as: 'Alternative1',
          attributes: ['id', 'name', 'code'] 
        },
        { 
          model: Alternative, 
          as: 'Alternative2', 
          attributes: ['id', 'name', 'code'] 
        },
        { 
          model: Criteria, 
          attributes: ['id', 'name', 'code'] 
        }
      ]
    });

    res.json({
      success: true,
      data: comparisons
    });
  } catch (error) {
    console.error('Get alternative comparisons error:', error);
    res.status(500).json({ success: false, message: 'Failed to get comparisons' });
  }
};