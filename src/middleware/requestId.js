const crypto = require('crypto');

/**
 * Middleware that assigns or forwards an X-Request-Id header.
 * Essential for audit logging, tracing LP requests, and incident debugging.
 */
module.exports = function requestIdMiddleware(req, res, next) {
  const incomingId = req.headers['x-request-id'];
  const requestId = incomingId && typeof incomingId === 'string' && incomingId.length <= 64
    ? incomingId
    : crypto.randomUUID();

  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
};
