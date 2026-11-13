const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    action: {
      type: String,
      enum: ['CREATE', 'UPDATE', 'DELETE', 'EXTRACT', 'APPROVE', 'REJECT', 'GENERATE_REPORT'],
      required: true
    },
    entityType: {
      type: String,
      enum: ['Fund', 'PortfolioCompany', 'Document', 'ExtractedKPI', 'Valuation', 'OperationalInsight', 'Risk', 'InvestorReport'],
      required: true
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    originalValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    correctedValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    fieldName: {
      type: String,
      default: null
    },
    reason: {
      type: String,
      default: ''
    },
    ipAddress: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);

