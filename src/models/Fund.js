const mongoose = require('mongoose');

const fundSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Fund name is required'],
      trim: true
    },
    identifier: {
      type: String,
      required: [true, 'Fund identifier is required (e.g., PE-FUND-IV)'],
      unique: true,
      uppercase: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    vintageYear: {
      type: Number,
      required: true
    },
    targetSize: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true
    },
    investmentPeriod: {
      startDate: { type: Date },
      endDate: { type: Date }
    },
    reportingPeriod: {
      quarter: { type: String, enum: ['Q1', 'Q2', 'Q3', 'Q4'], default: 'Q3' },
      year: { type: Number, default: 2026 }
    },
    status: {
      type: String,
      enum: ['Active', 'Harvesting', 'Closed'],
      default: 'Active'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Fund', fundSchema);
