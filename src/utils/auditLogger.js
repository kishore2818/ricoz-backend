const AuditLog = require('../models/AuditLog');

const logAudit = async ({
  userId,
  action,
  entityType,
  entityId,
  originalValue = null,
  correctedValue = null,
  fieldName = null,
  reason = '',
  req = null
}) => {
  try {
    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '') : '';
    await AuditLog.create({
      userId,
      action,
      entityType,
      entityId,
      originalValue,
      correctedValue,
      fieldName,
      reason,
      ipAddress
    });
  } catch (err) {
    console.error('[AuditLog Error] Failed to persist audit trail:', err.message);
  }
};

module.exports = { logAudit };

