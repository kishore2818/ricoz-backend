const rateLimit = require('express-rate-limit');

/**
 * Standardized JSON error response when rate limit is exceeded
 */
const rateLimitHandler = (message) => (req, res) => {
  res.status(429).json({
    success: false,
    error: 'Too Many Requests',
    message: message || 'Too many requests from this IP address. Please try again later.',
    retryAfter: res.getHeader('Retry-After') || 60,
    timestamp: new Date().toISOString()
  });
};

/**
 * General API rate limiter
 * Allows up to 300 requests per 15-minute window
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler('Too many requests to the PE LP Reporting API. Please try again later.')
});

/**
 * Strict Auth rate limiter
 * Protects login and register against brute force and credential stuffing
 * Allows up to 25 attempts per 15-minute window
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler('Too many authentication attempts. For security reasons, please wait 15 minutes before trying again.')
});

/**
 * Document Upload rate limiter
 * Prevents storage abuse and parser CPU exhaustion
 * Allows up to 40 uploads per 15-minute window
 */
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler('Upload limit exceeded. Please wait a few minutes before submitting more portfolio filings.')
});

module.exports = {
  apiLimiter,
  authLimiter,
  uploadLimiter
};
