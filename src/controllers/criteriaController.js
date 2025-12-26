const Criteria = require('../models/criteria');

// CREATE
exports.createCriteria = async (req, res) => {
  try {
    const { name, weight } = req.body;

    const criteria = await Criteria.create({ name, weight });

    res.json({ success: true, data: criteria });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET ALL
exports.getAllCriteria = async (req, res) => {
  try {
    const criteria = await Criteria.findAll();
    res.json({ success: true, data: criteria });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET SINGLE
exports.getCriteriaById = async (req, res) => {
  try {
    const criteria = await Criteria.findByPk(req.params.id);
    if (!criteria) return res.status(404).json({ message: 'Not found' });
    res.json({ success: true, data: criteria });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE
exports.updateCriteria = async (req, res) => {
  try {
    const { name, weight } = req.body;

    const criteria = await Criteria.findByPk(req.params.id);
    if (!criteria) return res.status(404).json({ message: 'Not found' });

    criteria.name = name ?? criteria.name;
    criteria.weight = weight ?? criteria.weight;

    await criteria.save();

    res.json({ success: true, data: criteria });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE
exports.deleteCriteria = async (req, res) => {
  try {
    const criteria = await Criteria.findByPk(req.params.id);
    if (!criteria) return res.status(404).json({ message: 'Not found' });

    await criteria.destroy();
    res.json({ success: true, message: 'Deleted successfully' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
