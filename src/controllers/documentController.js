const fs = require('fs');
const Document = require('../models/Document');
const PortfolioCompany = require('../models/PortfolioCompany');
const { processDocumentExtraction } = require('../services/extraction/kpiExtractionService');
const { logAudit } = require('../utils/auditLogger');

const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { fundId, companyId, reportingQuarter, reportingYear } = req.body;

    if (!fundId || !companyId || !reportingQuarter || !reportingYear) {
      // Clean up uploaded file if metadata is missing
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Missing required metadata: fundId, companyId, reportingQuarter, and reportingYear are required.'
      });
    }

    // Duplicate check
    const existingDoc = await Document.findOne({
      companyId,
      reportingQuarter,
      reportingYear: parseInt(reportingYear, 10),
      originalName: req.file.originalname
    });

    if (existingDoc) {
      console.log(`[Upload] Notice: Duplicate file uploaded for company ${companyId} - ${reportingQuarter} ${reportingYear}. Updating record.`);
    }

    const newDoc = await Document.create({
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: req.file.path,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      fundId,
      companyId,
      reportingQuarter,
      reportingYear: parseInt(reportingYear, 10),
      status: 'Uploaded',
      uploadedBy: req.user._id
    });

    await logAudit({
      userId: req.user._id,
      action: 'CREATE',
      entityType: 'Document',
      entityId: newDoc._id,
      correctedValue: { fileName: newDoc.fileName, originalName: newDoc.originalName },
      reason: 'Quarterly report file uploaded',
      req
    });

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: newDoc
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

const getDocuments = async (req, res, next) => {
  try {
    const { fundId, companyId, status } = req.query;
    const filter = {};
    if (fundId) filter.fundId = fundId;
    if (companyId) filter.companyId = companyId;
    if (status) filter.status = status;

    const documents = await Document.find(filter)
      .populate('companyId', 'name industry')
      .populate('fundId', 'name identifier')
      .populate('uploadedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents
    });
  } catch (error) {
    next(error);
  }
};

const getDocumentById = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id)
      .populate('companyId')
      .populate('fundId')
      .populate('uploadedBy', 'name email role');

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    res.status(200).json({
      success: true,
      data: doc
    });
  } catch (error) {
    next(error);
  }
};

const processDocument = async (req, res, next) => {
  try {
    const result = await processDocumentExtraction(req.params.id, req.user._id);

    await logAudit({
      userId: req.user._id,
      action: 'EXTRACT',
      entityType: 'Document',
      entityId: req.params.id,
      correctedValue: result,
      reason: 'Triggered AI document processing and extraction',
      req
    });

    res.status(200).json({
      success: true,
      message: 'Document processed successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const deleteDocument = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    if (fs.existsSync(doc.filePath)) {
      try {
        fs.unlinkSync(doc.filePath);
      } catch (e) {
        console.warn(`Could not delete physical file: ${e.message}`);
      }
    }

    await doc.deleteOne();

    await logAudit({
      userId: req.user._id,
      action: 'DELETE',
      entityType: 'Document',
      entityId: req.params.id,
      reason: 'Document deleted by authorized user',
      req
    });

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadDocument,
  getDocuments,
  getDocumentById,
  processDocument,
  deleteDocument
};

