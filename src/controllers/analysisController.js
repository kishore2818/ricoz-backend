const ExtractedKPI = require('../models/ExtractedKPI');
const Valuation = require('../models/Valuation');
const OperationalInsight = require('../models/OperationalInsight');
const Risk = require('../models/Risk');
const QuarterlyAnalysis = require('../models/QuarterlyAnalysis');
const Document = require('../models/Document');
const { processDocumentExtraction } = require('../services/extraction/kpiExtractionService');

const getAnalysisByCompanyId = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const { quarter, year } = req.query;

    const filter = { companyId };
    if (quarter) filter.reportingQuarter = quarter;
    if (year) filter.reportingYear = parseInt(year, 10);

    const [kpis, valuations, narratives, risks, summary] = await Promise.all([
      ExtractedKPI.find(filter).sort({ category: 1, metricName: 1 }),
      Valuation.find(filter).sort({ reportingYear: -1, reportingQuarter: -1 }),
      OperationalInsight.find(filter),
      Risk.find(filter).sort({ severity: 1 }),
      QuarterlyAnalysis.findOne(filter).populate('documentId', 'originalName status createdAt')
    ]);

    res.status(200).json({
      success: true,
      data: {
        companyId,
        kpis,
        valuations,
        narratives,
        risks,
        summary
      }
    });
  } catch (error) {
    next(error);
  }
};

const getAnalysisByDocumentId = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const doc = await Document.findById(documentId).populate('companyId').populate('fundId');
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const [kpis, valuations, narratives, risks, summary] = await Promise.all([
      ExtractedKPI.find({ documentId }).sort({ category: 1, metricName: 1 }),
      Valuation.find({ companyId: doc.companyId._id, reportingQuarter: doc.reportingQuarter, reportingYear: doc.reportingYear }),
      OperationalInsight.find({ documentId }),
      Risk.find({ documentId }).sort({ severity: 1 }),
      QuarterlyAnalysis.findOne({ documentId })
    ]);

    res.status(200).json({
      success: true,
      data: {
        document: doc,
        kpis,
        valuations,
        narratives,
        risks,
        summary
      }
    });
  } catch (error) {
    next(error);
  }
};

const triggerAnalysisForDocument = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const result = await processDocumentExtraction(documentId, req.user._id);
    res.status(200).json({
      success: true,
      message: 'Analysis completed successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnalysisByCompanyId,
  getAnalysisByDocumentId,
  triggerAnalysisForDocument
};

