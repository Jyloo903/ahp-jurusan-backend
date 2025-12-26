// src/models/University.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/config');

const University = sequelize.define('University', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  code: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  city: {
    type: DataTypes.ENUM('Bogor', 'Depok', 'Jakarta', 'Bandung'),
    allowNull: false
  },
  distance_rank: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  image_url: {
    type: DataTypes.STRING,
    allowNull: true
  }
  // HAPUS major_id disini
}, {
  tableName: 'universities',
  timestamps: true,
  underscored: true
});

module.exports = University;