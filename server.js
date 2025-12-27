require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const sequelize = require('./config/config');
require('./src/models');

const { apiLimiter } = require('./src/middleware/rateLimitMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration - PERLU DIUPDATE NANTI!
const allowedOrigins = [
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'https://YOUR_GITHUB_USERNAME.github.io' // GANTI SETELAH DEPLOY FRONTEND
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'CORS policy blocks this origin';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Trust proxy untuk Railway
app.set('trust proxy', 1);

// SIMPLE HEALTH CHECK - HARUS SEBELUM RATE LIMIT!
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// Rate limiting (setelah health check)
app.use('/api', apiLimiter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'AHP Jurusan API is running ✅',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      api: '/api',
      docs: 'Coming soon...'
    }
  });
});

// IMPORT ROUTES
const authRoutes = require('./src/routes/authRoutes');
const criteriaRoutes = require('./src/routes/criteriaRoutes');
const alternativeRoutes = require('./src/routes/alternativeRoutes');
const pairwiseRoutes = require('./src/routes/pairwiseRoutes');
const ahpRoutes = require('./src/routes/ahpRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const preferenceRoutes = require('./src/routes/preferenceRoutes');
const alternativeComparisonRoutes = require('./src/routes/alternativeComparisonRoutes');
const universityRoutes = require('./src/routes/universityRoutes');
const recommendationRunRoutes = require('./src/routes/recommendationRunRoutes');

// USE ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/criteria', criteriaRoutes);
app.use('/api/alternatives', alternativeRoutes);
app.use('/api/pairwise', pairwiseRoutes);
app.use('/api/ahp', ahpRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/preferences', preferenceRoutes);
app.use('/api/alternative-comparisons', alternativeComparisonRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/recommendation-run', recommendationRunRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.errors
    });
  }
  
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path
  });
});

// SYNC DB & START SERVER
sequelize.sync({ alter: true })
  .then(() => {
    console.log('✅ Database models synced');
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🚀 AHP Jurusan API Server');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📡 Port: ${PORT}`);
      console.log(`🌐 URL: http://0.0.0.0:${PORT}`);
      console.log(`🔧 Env: ${process.env.NODE_ENV || 'development'}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ Health check: /health');
      console.log('✅ API Root: /');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });
    
    // Graceful shutdown handler
    process.on('SIGTERM', () => {
      console.log('🔄 SIGTERM received, shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed');
        sequelize.close();
        process.exit(0);
      });
    });
    
  })
  .catch((err) => {
    console.error('❌ Database sync failed:', err);
    process.exit(1);
  });