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

// CORS configuration - UPDATED FOR VERCEL
const allowedOrigins = [
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'https://ahp-pemilihan-jurusan.vercel.app', // VERCEL PRODUCTION
  'https://*.vercel.app', // ALL VERCEL SUBDOMAINS
  'https://ahp-pemilihan-jurusan-git-*.vercel.app' // VERCEL PREVIEW DEPLOYMENTS
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl)
    if (!origin) return callback(null, true);
    
    // Development environment - allow all
    if (process.env.NODE_ENV === 'development') {
      console.log(`🌐 DEV: Allowing origin: ${origin}`);
      return callback(null, true);
    }
    
    // Check exact match
    if (allowedOrigins.includes(origin)) {
      console.log(`✅ CORS: Allowed exact match: ${origin}`);
      return callback(null, true);
    }
    
    // Check wildcard domains
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed.includes('*')) {
        const pattern = allowed.replace('*', '.*');
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      console.log(`✅ CORS: Allowed by pattern: ${origin}`);
      return callback(null, true);
    }
    
    // Check vercel.app domains
    if (origin.endsWith('.vercel.app')) {
      console.log(`✅ CORS: Allowing Vercel domain: ${origin}`);
      return callback(null, true);
    }
    
    // Blocked
    console.warn(`🚨 CORS: Blocked origin: ${origin}`);
    const msg = `CORS policy blocks this origin: ${origin}. Allowed: ${allowedOrigins.join(', ')}`;
    return callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy untuk Railway
app.set('trust proxy', 1);

// SIMPLE HEALTH CHECK - HARUS SEBELUM RATE LIMIT!
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: 'connected'
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Rate limiting (setelah health check)
app.use('/api', apiLimiter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    success: true,
    message: 'AHP Jurusan API is running ✅',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    cors: {
      allowedOrigins: allowedOrigins,
      note: 'Configured for Vercel deployment'
    },
    endpoints: {
      health: '/health',
      api: '/api',
      auth: '/api/auth',
      criteria: '/api/criteria',
      alternatives: '/api/alternatives'
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
  console.error('❌ Server Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  // CORS Error khusus
  if (err.message.includes('CORS policy')) {
    return res.status(403).json({
      success: false,
      message: err.message,
      details: 'Please check your frontend domain is allowed',
      allowedOrigins: allowedOrigins,
      currentOrigin: req.headers.origin || 'No origin header'
    });
  }
  
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
  
  // Rate limit error
  if (err.name === 'RateLimitError') {
    return res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later'
    });
  }
  
  // Default error
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  console.warn('🔍 404 Not Found:', {
    path: req.path,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    suggestion: 'Check / endpoint for available routes'
  });
});

// SYNC DB & START SERVER
sequelize.sync({ alter: true })
  .then(() => {
    console.log('✅ Database models synced');
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🚀 AHP Jurusan API Server - PRODUCTION READY');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📡 Port: ${PORT}`);
      console.log(`🌐 URL: http://0.0.0.0:${PORT}`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔒 CORS Enabled for: ${allowedOrigins.join(', ')}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ Health check: /health');
      console.log('✅ API Health: /api/health');
      console.log('✅ API Root: /');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📋 Available Routes:');
      console.log('  🔐 Auth: /api/auth');
      console.log('  📊 Criteria: /api/criteria');
      console.log('  🎓 Alternatives: /api/alternatives');
      console.log('  ⚖️ Pairwise: /api/pairwise');
      console.log('  🧮 AHP: /api/ahp');
      console.log('  👨‍💼 Admin: /api/admin');
      console.log('  🏛️ Universities: /api/universities');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });
    
    // Graceful shutdown handler
    const gracefulShutdown = () => {
      console.log('🔄 Received shutdown signal, shutting down gracefully...');
      server.close(() => {
        console.log('✅ HTTP server closed');
        sequelize.close().then(() => {
          console.log('✅ Database connection closed');
          process.exit(0);
        });
      });
    };
    
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    
  })
  .catch((err) => {
    console.error('❌ Database sync failed:', err);
    process.exit(1);
  });