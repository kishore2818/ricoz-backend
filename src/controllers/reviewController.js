const ExtractedKPI = require('../models/ExtractedKPI');
const Valuation = require('../models/Valuation');
const OperationalInsight = require('../models/OperationalInsight');
const Risk = require('../models/Risk');
const QuarterlyAnalysis = require('../models/QuarterlyAnalysis');
const { logAudit } = require('../utils/auditLogger');

const getPendingReviews = async (req, res, next) => {
  try {
    const { fundId } = req.query;
    const filter = { verificationStatus: { $in: ['Pending', 'Needs Review'] } };
    if (fundId) filter.fundId = fundId;

    const [pendingKPIs, pendingValuations, pendingNarratives, pendingRisks, analyses] = await Promise.all([
      ExtractedKPI.find(filter).populate('companyId', 'name industry').populate('documentId', 'originalName').limit(50),
      Valuation.find({ verificationStatus: 'Pending' }).populate('companyId', 'name industry').limit(20),
      OperationalInsight.find({ isApproved: false }).populate('companyId', 'name industry').limit(30),
      Risk.find({ status: 'Flagged' }).populate('companyId', 'name industry').limit(30),
      QuarterlyAnalysis.find({ status: 'Needs Review' }).populate('companyId', 'name').populate('documentId')
    ]);

    res.status(200).json({
      success: true,
      data: {
        pendingKPIs,
        pendingValuations,
        pendingNarratives,
        pendingRisks,
        pendingAnalyses: analyses
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateKPIReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { extractedValue, unitOrCurrency, verificationStatus, reviewerNote, reason } = req.body;

    const kpi = await ExtractedKPI.findById(id);
    if (!kpi) {
      return res.status(404).json({ success: false, message: 'Extracted KPI not found' });
    }

    const originalValue = {
      extractedValue: kpi.extractedValue,
      unitOrCurrency: kpi.unitOrCurrency,
      verificationStatus: kpi.verificationStatus
    };

    if (extractedValue !== undefined) kpi.extractedValue = extractedValue;
    if (unitOrCurrency !== undefined) kpi.unitOrCurrency = unitOrCurrency;
    if (verificationStatus !== undefined) kpi.verificationStatus = verificationStatus;
    if (reviewerNote !== undefined) kpi.reviewerNote = reviewerNote;
    kpi.reviewedBy = req.user._id;

    await kpi.save();

    await logAudit({
      userId: req.user._id,
      action: 'UPDATE',
      entityType: 'ExtractedKPI',
      entityId: kpi._id,
      fieldName: 'extractedValue',
      originalValue,
      correctedValue: {
        extractedValue: kpi.extractedValue,
        unitOrCurrency: kpi.unitOrCurrency,
        verificationStatus: kpi.verificationStatus
      },
      reason: reason || reviewerNote || 'Analyst manual verification/correction',
      req
    });

    res.status(200).json({
      success: true,
      message: 'KPI verified and updated successfully',
      data: kpi
    });
  } catch (error) {
    next(error);
  }
};

const approveQuarterlyAnalysis = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reviewerComments } = req.body;

    const analysis = await QuarterlyAnalysis.findById(id);
    if (!analysis) {
      return res.status(404).json({ success: false, message: 'Quarterly analysis not found' });
    }

    analysis.status = 'Approved';
    analysis.reviewedBy = req.user._id;
    analysis.reviewedAt = new Date();
    if (reviewerComments) analysis.reviewerComments = reviewerComments;
    await analysis.save();

    // Mark associated KPIs, narratives, valuations as verified
    await Promise.all([
      ExtractedKPI.updateMany(
        { companyId: analysis.companyId, reportingQuarter: analysis.reportingQuarter, reportingYear: analysis.reportingYear },
        { verificationStatus: 'Verified', reviewedBy: req.user._id }
      ),
      OperationalInsight.updateMany(
        { companyId: analysis.companyId, reportingQuarter: analysis.reportingQuarter, reportingYear: analysis.reportingYear },
        { isApproved: true, reviewedBy: req.user._id }
      ),
      Valuation.updateMany(
        { companyId: analysis.companyId, reportingQuarter: analysis.reportingQuarter, reportingYear: analysis.reportingYear },
        { verificationStatus: 'Verified' }
      )
    ]);

    await logAudit({
      userId: req.user._id,
      action: 'APPROVE',
      entityType: 'QuarterlyAnalysis',
      entityId: analysis._id,
      correctedValue: { status: 'Approved' },
      reason: reviewerComments || 'Approved by reviewer for inclusion in LP packet',
      req
    });

    res.status(200).json({
      success: true,
      message: 'Quarterly analysis approved successfully',
      data: analysis
    });
  } catch (error) {
    next(error);
  }
};

const rejectQuarterlyAnalysis = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const analysis = await QuarterlyAnalysis.findById(id);
    if (!analysis) {
      return res.status(404).json({ success: false, message: 'Quarterly analysis not found' });
    }

    analysis.status = 'Rejected';
    analysis.reviewerComments = reason || 'Rejected during review';
    analysis.reviewedBy = req.user._id;
    analysis.reviewedAt = new Date();
    await analysis.save();

    await logAudit({
      userId: req.user._id,
      action: 'REJECT',
      entityType: 'QuarterlyAnalysis',
      entityId: analysis._id,
      correctedValue: { status: 'Rejected' },
      reason: reason || 'Quarterly analysis rejected',
      req
    });

    res.status(200).json({
      success: true,
      message: 'Quarterly analysis rejected',
      data: analysis
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPendingReviews,
  updateKPIReview,
  approveQuarterlyAnalysis,
  rejectQuarterlyAnalysis
};

