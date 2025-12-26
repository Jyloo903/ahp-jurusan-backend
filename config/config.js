const { Sequelize } = require('sequelize');
require('dotenv').config();

// PASTIKAN ADA SSL settings untuk Railway!
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'mysql',
  dialectOptions: {
    ssl: {
      require: true,           // ✅ WAJIB untuk Railway
      rejectUnauthorized: false // ✅ WAJIB untuk Railway
    }
  },
  logging: false,
});

sequelize.authenticate()
  .then(() => console.log('✅ Database connected'))
  .catch(err => console.error('❌ DB Connection Error:', err));

module.exports = sequelize;