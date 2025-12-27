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

// ========== CORS CONFIGURATION - FIXED ==========
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin
    if (!origin) return callback(null, true);
    
    // Development - allow everything
    if (process.env.NODE_ENV === 'development') {
      console.log(`🌐 DEV: Allowing origin: ${origin}`);
      return callback(null, true);
    }
    
    // Production - check domains
    const allowedDomains = [
      'ahp-pemilihan-jurusan.vercel.app',
      'localhost',
      '127.0.0.1',
      'github.io'
    ];
    
    const isAllowed = allowedDomains.some(domain => 
      origin.includes(domain)
    );
    
    if (isAllowed) {
      console.log(`✅ PROD: Allowing origin: ${origin}`);
      return callback(null, true);
    }
    
    // Allow but log warning
    console.log(`⚠️ Allowing non-whitelisted origin: ${origin}`);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400
};

// Apply CORS middleware
app.use(cors(corsOptions));

// ========== FIX: Handle preflight requests ==========
// JANGAN pakai app.options('*', ...) - itu yang bikin error!
// Express sudah handle preflight otomatis dengan cors()

// ========== MIDDLEWARE ==========
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy untuk Railway
app.set('trust proxy', 1);

// ========== HEALTH ENDPOINTS ==========
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    cors: {
      enabled: true,
      origin: req.headers.origin || 'No origin header'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    request: {
      origin: req.headers.origin,
      method: req.method,
      ip: req.ip
    }
  });
});

// ========== RATE LIMITING ==========
app.use('/api', apiLimiter);

// ========== ROOT ENDPOINT ==========
app.get('/', (req, res) => {
  res.json({ 
    success: true,
    message: '🚀 AHP Jurusan API Server is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    cors: 'enabled',
    endpoints: {
      health: '/health',
      apiHealth: '/api/health',
      auth: '/api/auth',
      criteria: '/api/criteria',
      alternatives: '/api/alternatives',
      pairwise: '/api/pairwise',
      preferences: '/api/preferences',
      ahp: '/api/ahp',
      admin: '/api/admin',
      universities: '/api/universities'
    }
  });
});

// ========== IMPORT ROUTES ==========
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

// ========== USE ROUTES ==========
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

// ========== ERROR HANDLING ==========
// 404 - Route not found
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
    timestamp: new Date().toISOString(),
    suggestion: 'Check / endpoint for available routes'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', {
    message: err.message,
    path: req.path,
    method: req.method,
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });

  // CORS error
  if (err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      message: 'CORS Error',
      details: err.message
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const errorMessage = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;

  res.status(statusCode).json({
    success: false,
    message: errorMessage
  });
});

// ========== START SERVER ==========
sequelize.sync({ alter: process.env.NODE_ENV === 'development' })
  .then(() => {
    console.log('✅ Database models synced successfully');
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🚀 AHP Jurusan API Server - RUNNING');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📡 Port: ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔒 CORS: Enabled`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ Health Check: /health');
      console.log('✅ API Root: /');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`🚀 Server started at ${new Date().toISOString()}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });

    // Graceful shutdown
    const gracefulShutdown = () => {
      console.log('Shutdown signal received...');
      server.close(() => {
        console.log('Server closed');
        sequelize.close();
        process.exit(0);
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    
  })
  .catch((err) => {
    console.error('❌ Failed to sync database:', err);
    process.exit(1);
  });

module.exports = app;