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
app.use(helmet()); // Menambahkan security headers
// CORS configuration
const allowedOrigins = [
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'https://YOUR_GITHUB_USERNAME.github.io' // Ganti nanti dengan GitHub Pages URL
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Limit request body size


// Trust proxy (penting untuk rate limiting)
app.set('trust proxy', 1);

// Rate limiting untuk semua API routes (kecuali auth yang punya rate limit sendiri)
app.use('/api', apiLimiter);

// ROUTES
app.get('/', (req, res) => {
  res.json({ 
    message: 'AHP Jurusan API is running ✅',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint (tanpa rate limit)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
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
app.use('/api/auth', authRoutes); // Auth routes punya rate limit sendiri
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
  console.error('❌ Error:', err);
  
  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.errors
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }
  
  // Default error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// SYNC DB & START SERVER
sequelize.sync({ alter: true })
  .then(() => {
    console.log('✅ Models synced with database');
    app.listen(PORT, () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🚀 AHP Jurusan API Server');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📡 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔒 Security: Helmet + Rate Limiting enabled`);
      console.log(`📝 API Documentation: http://localhost:${PORT}/`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });
  })
  .catch((err) => {
    console.error('❌ Failed to sync models:', err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, closing server gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    sequelize.close();
    process.exit(0);
  });
});