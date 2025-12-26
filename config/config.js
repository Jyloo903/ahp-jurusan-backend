const { Sequelize } = require('sequelize'); // BARIS INI WAJIB ADA
require('dotenv').config();

// DATABASE_URL dari environment variable Railway
const databaseUrl = process.env.DATABASE_URL;

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'mysql',
  dialectOptions: {
    // Memaksa SSL di Production (Railway)
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Test koneksi
sequelize.authenticate()
  .then(() => console.log('✅ Database connected successfully'))
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
  });

module.exports = sequelize;
