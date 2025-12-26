const jwt = require('jsonwebtoken');
const User = require('../models/user');

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token user' });
    }

    req.user = user; // SIMPAN ROLE & ID DI SINI
    next();

  } catch (err) {
    return res.status(401).json({ message: 'Invalid token', error: err.message });
  }
};
