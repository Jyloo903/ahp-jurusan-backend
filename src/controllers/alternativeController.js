const Alternative = require('../models/alternative');

// CREATE
exports.createAlternative = async (req, res) => {
  try {
    const { name, description } = req.body;

    const alt = await Alternative.create({ name, description });

    res.json({ success: true, data: alt });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET ALL
exports.getAlternatives = async (req, res) => {
  try {
    const alt = await Alternative.findAll();
    res.json({ success: true, data: alt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET ONE
exports.getAlternativeById = async (req, res) => {
  try {
    const alt = await Alternative.findByPk(req.params.id);
    if (!alt) return res.status(404).json({ message: 'Not found' });

    res.json({ success: true, data: alt });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE
exports.updateAlternative = async (req, res) => {
  try {
    const { name, description } = req.body;

    const alt = await Alternative.findByPk(req.params.id);
    if (!alt) return res.status(404).json({ message: 'Not found' });

    alt.name = name ?? alt.name;
    alt.description = description ?? alt.description;

    await alt.save();

    res.json({ success: true, data: alt });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE
exports.deleteAlternative = async (req, res) => {
  try {
    const alt = await Alternative.findByPk(req.params.id);
    if (!alt) return res.status(404).json({ message: 'Not found' });

    await alt.destroy();

    res.json({ success: true, message: 'Deleted successfully' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
