const mongoose = require('mongoose');

const extractedKPISchema = new mongoose.Schema(
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
    metricName: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: ['Financial', 'Operational'],
      required: true
    },
    extractedValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null // strict: null if not reported
    },
    unitOrCurrency: {
      type: String,
      default: 'USD'
    },
    isCalculated: {
      type: Boolean,
      default: false
    },
    sourceDocumentName: {
      type: String,
      default: ''
    },
    sourcePageNumber: {
      type: Number,
      default: null
    },
    sourceSection: {
      type: String,
      default: ''
    },
    sourceSnippet: {
      type: String,
      default: ''
    },
    extractionConfidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.95
    },
    verificationStatus: {
      type: String,
      enum: ['Pending', 'Verified', 'Corrected', 'Rejected'],
      default: 'Pending'
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewerNote: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

extractedKPISchema.index({ companyId: 1, reportingQuarter: 1, reportingYear: 1, metricName: 1 });

module.exports = mongoose.model('ExtractedKPI', extractedKPISchema);

