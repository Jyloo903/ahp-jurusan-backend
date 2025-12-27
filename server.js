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

// ========== CORS CONFIGURATION - UPDATED ==========
// Allow ALL origins for now - will restrict later if needed
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl)
    if (!origin) return callback(null, true);
    
    // Development - allow everything
    if (process.env.NODE_ENV === 'development') {
      console.log(`🌐 DEV: Allowing origin: ${origin}`);
      return callback(null, true);
    }
    
    // Production - allow specific domains
    const allowedDomains = [
      'ahp-pemilihan-jurusan.vercel.app',
      'localhost',
      '127.0.0.1',
      'github.io'
    ];
    
    // Check if origin contains any allowed domain
    const isAllowed = allowedDomains.some(domain => 
      origin.includes(domain)
    );
    
    if (isAllowed) {
      console.log(`✅ PROD: Allowing origin: ${origin}`);
      return callback(null, true);
    }
    
    // If not explicitly allowed, still allow but log warning
    console.log(`⚠️  Allowing non-whitelisted origin: ${origin}`);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Handle preflight requests for all routes
app.options('*', cors(corsOptions));

// ========== MIDDLEWARE ==========
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy untuk Railway
app.set('trust proxy', 1);

// ========== HEALTH ENDPOINTS (NO RATE LIMIT) ==========
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
      origin: req.headers.origin || 'No origin header',
      note: 'CORS configured for frontend access'
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
    cors: {
      status: 'enabled',
      origin: req.headers.origin || 'Not specified',
      methods: corsOptions.methods
    },
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
    },
    documentation: 'API documentation coming soon...'
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

  // CORS specific error
  if (err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      message: 'CORS Error: ' + err.message,
      details: {
        requestedOrigin: req.headers.origin,
        allowedMethods: corsOptions.methods
      }
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

  // Validation errors
  if (err.name === 'ValidationError' || err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.errors || err.message
    });
  }

  // Rate limit error
  if (err.name === 'RateLimitError') {
    return res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later'
    });
  }

  // Sequelize errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry',
      field: err.errors?.[0]?.path
    });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const errorMessage = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;

  res.status(statusCode).json({
    success: false,
    message: errorMessage,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      error: err.message
    })
  });
});

// ========== START SERVER ==========
sequelize.sync({ alter: process.env.NODE_ENV === 'development' })
  .then(() => {
    console.log('✅ Database models synced successfully');
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🚀 AHP Jurusan API Server - PRODUCTION READY');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📡 Port: ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔒 CORS: Enabled for frontend access`);
      console.log(`📊 Database: Connected & Synced`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ Health Check: /health');
      console.log('✅ API Root: /');
      console.log('✅ API Health: /api/health');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📋 Available Endpoints:');
      console.log('  🔐 Auth:          /api/auth');
      console.log('  📊 Criteria:      /api/criteria');
      console.log('  🎓 Alternatives:  /api/alternatives');
      console.log('  ⚖️ Pairwise:      /api/pairwise');
      console.log('  💯 Preferences:   /api/preferences');
      console.log('  🧮 AHP Calculate: /api/ahp/calculate');
      console.log('  👨‍💼 Admin:        /api/admin');
      console.log('  🏛️ Universities:  /api/universities');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`🚀 Server is ready to accept connections`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`\n${signal} received, starting graceful shutdown...`);
      
      server.close(() => {
        console.log('✅ HTTP server closed');
        sequelize.close().then(() => {
          console.log('✅ Database connection closed');
          process.exit(0);
        });
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('❌ Could not close connections in time, forcing shutdown');
        process.exit(1);
      }, 10000);
    };

    // Listen for shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  })
  .catch((err) => {
    console.error('❌ Failed to sync database:', err);
    process.exit(1);
  });

// Export app for testing
module.exports = app;