const mongoose = require('mongoose');

const portfolioCompanySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true
    },
    industry: {
      type: String,
      required: [true, 'Industry is required'],
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    investmentDate: {
      type: Date,
      required: true
    },
    initialInvestmentAmount: {
      type: Number,
      required: [true, 'Initial investment amount is required']
    },
    currentValuation: {
      type: Number,
      required: [true, 'Current valuation is required']
    },
    ownershipPercentage: {
      type: Number,
      default: 0
    },
    fundId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fund',
      required: [true, 'Fund association is required']
    },
    reportingStatus: {
      type: String,
      enum: ['Up to Date', 'Pending Submission', 'Under Review', 'Delinquent'],
      default: 'Pending Submission'
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true
    }
  },
  { timestamps: true }
);

portfolioCompanySchema.index({ fundId: 1, name: 1 });

module.exports = mongoose.model('PortfolioCompany', portfolioCompanySchema);

