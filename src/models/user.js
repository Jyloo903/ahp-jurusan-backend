const { DataTypes } = require('sequelize');
const sequelize = require('../../config/config');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  name: DataTypes.STRING,
  email: DataTypes.STRING,
  password: DataTypes.STRING,
  role: {
    type: DataTypes.ENUM('user', 'admin', 'superadmin'),
    defaultValue: 'user'
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
});

module.exports = User;
