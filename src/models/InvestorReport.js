const mongoose = require('mongoose');

const investorReportSchema = new mongoose.Schema(
  {
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
      required: true
    },
    status: {
      type: String,
      enum: ['Draft', 'Approved'],
      default: 'Draft'
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    approvedAt: {
      type: Date,
      default: null
    },
    pdfFileName: {
      type: String,
      default: ''
    },
    pdfFilePath: {
      type: String,
      default: ''
    },
    summarySnapshot: {
      totalPortfolioRevenue: Number,
      avgRevenueGrowth: Number,
      totalValuation: Number,
      totalValuationChange: Number,
      companyCount: Number,
      highRiskCount: Number
    },
    executiveSummary: {
      type: String,
      default: ''
    },
    disclaimer: {
      type: String,
      default: 'CONFIDENTIAL: Prepared exclusively for Limited Partners. Not for public redistribution.'
    }
  },
  { timestamps: true }
);

investorReportSchema.index({ fundId: 1, reportingQuarter: 1, reportingYear: 1 });

module.exports = mongoose.model('InvestorReport', investorReportSchema);

