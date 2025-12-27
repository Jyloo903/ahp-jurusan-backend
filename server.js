// server.js - AHP Jurusan Backend (FINAL VERSION)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const sequelize = require('./config/config');
require('./src/models');

const { apiLimiter } = require('./src/middleware/rateLimitMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// 1. CORS CONFIGURATION (FIXED FOR PRODUCTION)
// ============================================

// Untuk DEVELOPMENT: Allow semua origin
// Untuk PRODUCTION: Hanya allow origin tertentu
const isDevelopment = process.env.NODE_ENV !== 'production';

const allowedOrigins = [
  // Development origins
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'http://localhost:8080',
  'http://localhost:5173',
  'http://localhost:5174',
  
  // Production origins (GitHub Pages)
  'https://*.github.io',  // Semua GitHub Pages
  'https://ahp-jurusan-frontend.vercel.app', // Jika pakai Vercel nanti
  
  // Railway origin sendiri
  'https://ahp-jurusan-backend-production.up.railway.app',
  
  // Untuk testing langsung dari browser
  'null'  // Origin null (file://)
];

// Enhanced CORS middleware
app.use(cors({
  origin: function (origin, callback) {
    console.log('🌐 CORS Check - Origin:', origin || 'No origin');
    
    // 1. Allow semua di development mode
    if (isDevelopment) {
      console.log('✅ Development mode - Allowing all origins');
      return callback(null, true);
    }
    
    // 2. Allow jika tidak ada origin (mobile apps, curl, postman)
    if (!origin) {
      console.log('✅ No origin - Allowing');
      return callback(null, true);
    }
    
    // 3. Check jika origin ada di allowed list
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.includes('*')) {
        const regex = new RegExp(allowedOrigin.replace('*', '.*'));
        return regex.test(origin);
      }
      return origin === allowedOrigin;
    });
    
    if (isAllowed) {
      console.log(`✅ Origin allowed: ${origin}`);
      return callback(null, true);
    }
    
    // 4. Block jika tidak ada di allowed list
    console.log(`🚫 CORS blocked: ${origin}`);
    console.log('📋 Allowed origins:', allowedOrigins);
    return callback(new Error(`CORS not allowed for origin: ${origin}`), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Length', 'X-Request-ID'],
  maxAge: 86400 // 24 hours
}));

// Handle preflight requests
app.options('*', cors());

// ============================================
// 2. SECURITY MIDDLEWARE
// ============================================
app.use(helmet({
  contentSecurityPolicy: isDevelopment ? false : undefined,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// ============================================
// 3. BODY PARSER
// ============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// 4. TRUST PROXY (UNTUK RAILWAY)
// ============================================
app.set('trust proxy', 1);

// ============================================
// 5. HEALTH CHECK - HARUS SEBELUM RATE LIMIT!
// ============================================
app.get('/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: 'connected',
    memory: process.memoryUsage(),
    node: process.version,
    platform: process.platform
  };
  
  res.status(200).json(health);
});

// Simple ping endpoint
app.get('/ping', (req, res) => {
  res.status(200).json({ 
    message: 'pong',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// 6. RATE LIMITING (SETELAH HEALTH CHECK)
// ============================================
app.use('/api', apiLimiter);

// ============================================
// 7. ROOT ENDPOINT
// ============================================
app.get('/', (req, res) => {
  res.json({ 
    message: '🎉 AHP Jurusan API is running ✅',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/health',
      ping: '/ping',
      api: '/api',
      docs: 'Coming soon...'
    },
    cors: {
      allowedOrigins: allowedOrigins.slice(0, 5), // Show first 5
      mode: isDevelopment ? 'development (all)' : 'production (restricted)'
    }
  });
});

// ============================================
// 8. IMPORT ROUTES
// ============================================
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

// ============================================
// 9. USE ROUTES
// ============================================
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

// ============================================
// 10. ERROR HANDLING MIDDLEWARE
// ============================================
app.use((err, req, res, next) => {
  console.error('❌ Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  // CORS Error
  if (err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      message: 'CORS Error: Origin tidak diizinkan',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      allowedOrigins: isDevelopment ? ['All origins allowed'] : allowedOrigins.slice(0, 5)
    });
  }
  
  // Validation Error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.errors
    });
  }
  
  // JWT Error
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
  
  // Default Error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(isDevelopment && { stack: err.stack })
  });
});

// ============================================
// 11. 404 HANDLER
// ============================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path,
    method: req.method,
    availableEndpoints: ['/health', '/ping', '/api/*']
  });
});

// ============================================
// 12. DATABASE SYNC & START SERVER
// ============================================
sequelize.sync({ alter: isDevelopment }) // Hanya alter di development
  .then(() => {
    console.log('✅ Database models synced');
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🚀 AHP JURUSAN API SERVER STARTED');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📡 Port: ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health Check: https://ahp-jurusan-backend-production.up.railway.app/health`);
      console.log(`🎯 API Root: https://ahp-jurusan-backend-production.up.railway.app/`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📋 CORS Configuration:');
      console.log(`   Mode: ${isDevelopment ? 'DEVELOPMENT (All origins allowed)' : 'PRODUCTION (Restricted)'}`);
      console.log(`   Allowed Origins: ${isDevelopment ? 'ALL' : allowedOrigins.length + ' origins'}`);
      if (!isDevelopment) {
        allowedOrigins.slice(0, 3).forEach(origin => console.log(`   - ${origin}`));
        if (allowedOrigins.length > 3) console.log(`   ... and ${allowedOrigins.length - 3} more`);
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ Server is ready to accept connections');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      console.error('🔥 Uncaught Exception:', err);
      process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('🔥 Unhandled Rejection at:', promise, 'reason:', reason);
    });
    
  })
  .catch((err) => {
    console.error('❌ Database sync failed:', err);
    process.exit(1);
  });

module.exports = app;