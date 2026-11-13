const mongoose = require('mongoose');

const quarterlyAnalysisSchema = new mongoose.Schema(
  {
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
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
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
    status: {
      type: String,
      enum: ['Draft', 'Needs Review', 'Approved', 'Rejected'],
      default: 'Needs Review'
    },
    executiveSummary: {
      type: String,
      default: ''
    },
    financialHighlights: {
      type: [String],
      default: []
    },
    operationalHighlights: {
      type: [String],
      default: []
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: {
      type: Date
    },
    reviewerComments: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

quarterlyAnalysisSchema.index({ companyId: 1, reportingQuarter: 1, reportingYear: 1 }, { unique: true });

module.exports = mongoose.model('QuarterlyAnalysis', quarterlyAnalysisSchema);

