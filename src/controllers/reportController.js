const fs = require('fs');
const path = require('path');
const InvestorReport = require('../models/InvestorReport');
const Fund = require('../models/Fund');
const { generateLPReportPDF } = require('../services/reporting/pdfReportService');
const { logAudit } = require('../utils/auditLogger');

const generateReport = async (req, res, next) => {
  try {
    const { fundId, reportingQuarter, reportingYear, title, status = 'Draft' } = req.body;

    const fund = await Fund.findById(fundId);
    if (!fund) {
      return res.status(404).json({ success: false, message: 'Fund not found' });
    }

    const reportTitle = title || `${fund.name} - ${reportingQuarter} ${reportingYear} LP Quarterly Investor Packet`;

    const { fileName, filePath } = await generateLPReportPDF({
      fundId,
      reportingQuarter,
      reportingYear,
      reportTitle,
      status
    });

    const report = await InvestorReport.create({
      fundId,
      reportingQuarter,
      reportingYear,
      title: reportTitle,
      status,
      generatedBy: req.user._id,
      pdfFileName: fileName,
      pdfFilePath: filePath
    });

    await logAudit({
      userId: req.user._id,
      action: 'GENERATE_REPORT',
      entityType: 'InvestorReport',
      entityId: report._id,
      correctedValue: { fileName, status },
      reason: 'Generated LP quarterly investor packet PDF',
      req
    });

    res.status(201).json({
      success: true,
      message: 'Investor packet generated successfully',
      data: report
    });
  } catch (error) {
    next(error);
  }
};

const getReports = async (req, res, next) => {
  try {
    const { fundId } = req.query;
    const filter = fundId ? { fundId } : {};

    const reports = await InvestorReport.find(filter)
      .populate('fundId', 'name identifier currency')
      .populate('generatedBy', 'name email role')
      .populate('approvedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    next(error);
  }
};

const getReportById = async (req, res, next) => {
  try {
    const report = await InvestorReport.findById(req.params.id)
      .populate('fundId')
      .populate('generatedBy', 'name email role')
      .populate('approvedBy', 'name email role');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
};

const downloadReport = async (req, res, next) => {
  try {
    const report = await InvestorReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report record not found' });
    }

    if (!fs.existsSync(report.pdfFilePath)) {
      return res.status(404).json({ success: false, message: 'PDF file not found on disk. Regenerate the report.' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${report.pdfFileName}"`);

    const fileStream = fs.createReadStream(report.pdfFilePath);
    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateReport,
  getReports,
  getReportById,
  downloadReport
};

