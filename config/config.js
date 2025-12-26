const sequelize = new Sequelize(databaseUrl, {
  dialect: 'mysql',
  dialectOptions: {
    // Jika NODE_ENV adalah production, selalu aktifkan SSL
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  },
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});
