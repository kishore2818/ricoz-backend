const mongoose = require('mongoose');

const valuationSchema = new mongoose.Schema(
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
    reportingQuarter: {
      type: String,
      enum: ['Q1', 'Q2', 'Q3', 'Q4'],
      required: true
    },
    reportingYear: {
      type: Number,
      required: true
    },
    initialInvestmentAmount: {
      type: Number,
      required: true
    },
    previousValuation: {
      type: Number,
      default: null
    },
    currentValuation: {
      type: Number,
      required: true
    },
    valuationChange: {
      type: Number,
      default: 0 // Current Valuation - Previous Valuation
    },
    valuationGrowthPercent: {
      type: Number,
      default: 0 // ((Current - Previous) / Previous) * 100
    },
    currentInvestmentValue: {
      type: Number,
      default: null // fund share of valuation
    },
    currency: {
      type: String,
      default: 'USD'
    },
    sourceDocumentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document'
    },
    notes: {
      type: String,
      default: ''
    },
    verificationStatus: {
      type: String,
      enum: ['Pending', 'Verified', 'Corrected'],
      default: 'Pending'
    }
  },
  { timestamps: true }
);

valuationSchema.index({ companyId: 1, reportingQuarter: 1, reportingYear: 1 });

module.exports = mongoose.model('Valuation', valuationSchema);

