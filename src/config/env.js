const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
  PORT: process.env.PORT || 5001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/pe_reporting_agent',
  JWT_SECRET: process.env.JWT_SECRET || 'pe_secret_jwt_key_default_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  UPLOAD_DIR: process.env.UPLOAD_DIR || path.resolve(__dirname, '../../uploads'),
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE, 10) || 52428800, // 50MB
  LLM_PROVIDER: process.env.LLM_PROVIDER || 'openai',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL || null,
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000'
};

