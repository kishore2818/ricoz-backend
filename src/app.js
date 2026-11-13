const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const config = require('./config/env');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: false
}));

// CORS - Allow Vercel, localhost, and configured origins
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    
    // If CORS_ORIGIN is wildcard or unset in prod, allow all
    if (config.CORS_ORIGIN === '*' || !config.CORS_ORIGIN) {
      return callback(null, true);
    }

    // Allow any Vercel preview or production deployment, and localhost
    if (
      origin.endsWith('.vercel.app') ||
      origin.startsWith('http://localhost:') ||
      origin.startsWith('https://localhost:') ||
      origin === config.CORS_ORIGIN
    ) {
      return callback(null, true);
    }

    // Fallback: check comma-separated origins
    const allowed = config.CORS_ORIGIN.split(',').map(o => o.trim());
    if (allowed.includes(origin)) {
      return callback(null, true);
    }

    return callback(null, true); // Permissive in deployment to avoid blocking LP users
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Request Parsers
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

if (config.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Static folder for file downloads
app.use('/uploads', express.static(config.UPLOAD_DIR));

// Root Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Apex Horizon Capital — PE LP Reporting Agent Backend API is live.',
    status: 'healthy',
    version: '1.0.0',
    documentation: '/api/health',
    timestamp: new Date().toISOString()
  });
});

// Healthcheck
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Private Equity LP Quarterly Reporting Agent API'
  });
});

// API Routes
app.use('/api', routes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} not found`
  });
});

// Centralized Error Handling
app.use(errorHandler);

module.exports = app;

