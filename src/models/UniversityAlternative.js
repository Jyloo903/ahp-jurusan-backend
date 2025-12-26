// src/models/UniversityAlternative.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/config');

const UniversityAlternative = sequelize.define('UniversityAlternative', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  university_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'universities',
      key: 'id'
    }
  },
  alternative_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'alternatives',
      key: 'id'
    }
  },
  tuition_fee: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  accreditation: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'university_alternatives',
  timestamps: true,
  underscored: true
});

module.exports = UniversityAlternative;