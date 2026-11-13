const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    filePath: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    fundId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fund',
      required: true
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PortfolioCompany',
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
      enum: ['Uploaded', 'Pending', 'Processing', 'Completed', 'Needs Review', 'Failed'],
      default: 'Uploaded'
    },
    extractedTextPreview: {
      type: String,
      default: ''
    },
    pageCount: {
      type: Number,
      default: 0
    },
    isScanned: {
      type: Boolean,
      default: false
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    errorMessage: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

documentSchema.index({ companyId: 1, reportingQuarter: 1, reportingYear: 1 });
documentSchema.index({ status: 1 });

module.exports = mongoose.model('Document', documentSchema);

