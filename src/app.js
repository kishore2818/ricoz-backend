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

// CORS
app.use(cors({
  origin: config.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Request Parsers
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

if (config.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Static folder for file downloads
app.use('/uploads', express.static(config.UPLOAD_DIR));

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

