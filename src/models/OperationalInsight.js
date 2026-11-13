const mongoose = require('mongoose');

const operationalInsightSchema = new mongoose.Schema(
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
    section: {
      type: String,
      enum: [
        'performance_overview',
        'major_achievements',
        'revenue_highlights',
        'operational_improvements',
        'challenges',
        'risks',
        'management_updates',
        'growth_opportunities',
        'future_outlook'
      ],
      required: true
    },
    sectionTitle: {
      type: String,
      required: true
    },
    summaryText: {
      type: String,
      required: true
    },
    supportingEvidence: {
      type: String,
      default: ''
    },
    sourcePage: {
      type: Number,
      default: null
    },
    isApproved: {
      type: Boolean,
      default: false
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  { timestamps: true }
);

operationalInsightSchema.index({ companyId: 1, reportingQuarter: 1, reportingYear: 1 });

module.exports = mongoose.model('OperationalInsight', operationalInsightSchema);

