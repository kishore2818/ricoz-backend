const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const mongoose = require('mongoose');
const config = require('./config/env');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const requestIdMiddleware = require('./middleware/requestId');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();

// Traceability & Security Headers
app.use(requestIdMiddleware);
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
    documentation: '/api/docs',
    health: '/api/health',
    timestamp: new Date().toISOString()
  });
});

// Detailed System & DB Healthcheck
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const isHealthy = dbState === 1 || config.NODE_ENV === 'test';
  const memory = process.memoryUsage();

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    service: 'Private Equity LP Quarterly Reporting Agent API',
    version: '1.0.0',
    environment: config.NODE_ENV,
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStatusMap[dbState] || 'unknown',
      name: mongoose.connection.name || 'unconnected'
    },
    memory: {
      rssMB: Math.round(memory.rss / (1024 * 1024)),
      heapUsedMB: Math.round(memory.heapUsed / (1024 * 1024))
    },
    timestamp: new Date().toISOString()
  });
});

// Lightweight API Discovery / Docs Endpoint
app.get('/api/docs', (req, res) => {
  res.status(200).json({
    service: 'Apex Horizon Capital PE LP Reporting Agent API',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register a new institutional user',
        'POST /api/auth/login': 'Authenticate and retrieve JWT token',
        'GET /api/auth/me': 'Get current authenticated user profile'
      },
      funds: {
        'GET /api/funds': 'List fund vehicles',
        'POST /api/funds': 'Create a new fund vehicle (Admin only)'
      },
      companies: {
        'GET /api/companies': 'List portfolio companies',
        'GET /api/companies/:id': 'Get portfolio company detail and historical records'
      },
      documents: {
        'POST /api/documents/upload': 'Upload quarterly filing (PDF, CSV, Excel, Word)',
        'GET /api/documents': 'List uploaded documents',
        'POST /api/documents/:id/process': 'Trigger OCR, parsing, and KPI extraction'
      },
      analytics: {
        'GET /api/analytics/dashboard': 'Portfolio overview and aggregated KPIs',
        'GET /api/analytics/kpis': 'Filtered KPI time-series metrics',
        'GET /api/analytics/comparison': 'Quarter-over-quarter (QoQ) comparative analysis'
      },
      reports: {
        'GET /api/reports': 'List generated investor reports',
        'POST /api/reports/generate': 'Generate branded LP PDF disclosure tear-sheet'
      }
    }
  });
});

// Apply rate limiting to all /api routes
app.use('/api', apiLimiter);

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

