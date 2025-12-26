const { Sequelize } = require('sequelize');
require('dotenv').config();

// DATABASE_URL FALLBACK untuk development
const databaseUrl = process.env.DATABASE_URL || 'mysql://localhost:3306/test';

// Debug log (hanya di development)
if (process.env.NODE_ENV !== 'production') {
  console.log('🔧 Database URL:', databaseUrl ? '✅ Set' : '❌ Not set');
}

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'mysql',
  dialectOptions: {
    ssl: databaseUrl.includes('railway.app') || databaseUrl.includes('railway.internal') ? {
      require: true,
      rejectUnauthorized: false
    } : {}
  },
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

sequelize.authenticate()
  .then(() => console.log('✅ Database connected successfully'))
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    console.log('💡 Check DATABASE_URL environment variable');
  });

module.exports = sequelize;