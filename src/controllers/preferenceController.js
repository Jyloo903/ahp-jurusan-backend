const UserPreference = require('../models/UserPreference');
const Alternative = require('../models/alternative');
const Criteria = require('../models/criteria');

// SAVE
exports.savePreferences = async (req, res) => {
  try {
    const { preferences } = req.body;
    const userId = req.user.id;

    await UserPreference.destroy({ where: { user_id: userId } });

    const mapped = preferences.map(p => ({
      user_id: userId,
      alternative_id: p.alternative_id,
      criteria_id: p.criteria_id,
      score: p.score
    }));

    await UserPreference.bulkCreate(mapped);

    res.json({ success: true, message: "Preferences saved", data: mapped });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET
exports.getUserPreferences = async (req, res) => {
  try {
    const userId = req.user.id;

    const prefs = await UserPreference.findAll({
      where: { user_id: userId },
      include: [
        { model: Alternative, attributes: ['id','name','code'] },
        { model: Criteria, attributes: ['id','name','code'] }
      ]
    });

    res.json({ success: true, data: prefs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
