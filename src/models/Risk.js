const mongoose = require('mongoose');

const riskSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PortfolioCompany',
      required: true
    },
    fundId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fund',
      required: true
    },
    reportingQuarter: {
      type: String,
      enum: ['Q1', 'Q2', 'Q3', 'Q4'],
      required: true
    },
    reportingYear: {
      type: Number,
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['Financial', 'Operational', 'Market', 'Governance', 'Regulatory'],
      default: 'Operational'
    },
    severity: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium'
    },
    supportingEvidence: {
      type: String,
      default: ''
    },
    sourceDocument: {
      type: String,
      default: ''
    },
    sourcePage: {
      type: Number,
      default: null
    },
    recommendedAction: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['Flagged', 'Reviewed', 'Mitigated', 'Dismissed'],
      default: 'Flagged'
    },
    analystNotes: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

riskSchema.index({ companyId: 1, severity: 1 });

module.exports = mongoose.model('Risk', riskSchema);

