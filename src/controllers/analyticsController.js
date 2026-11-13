const { getDashboardMetrics, compareQuarterlyPerformance } = require('../services/analytics/comparisonService');
const ExtractedKPI = require('../models/ExtractedKPI');
const Valuation = require('../models/Valuation');
const PortfolioCompany = require('../models/PortfolioCompany');

const getDashboard = async (req, res, next) => {
  try {
    const metrics = await getDashboardMetrics();
    res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    next(error);
  }
};

const getKPIAnalytics = async (req, res, next) => {
  try {
    const { fundId, metricName = 'Revenue' } = req.query;
    const filter = { metricName, extractedValue: { $ne: null } };
    if (fundId) filter.fundId = fundId;

    const kpis = await ExtractedKPI.find(filter)
      .populate('companyId', 'name industry')
      .populate('fundId', 'name identifier')
      .sort({ reportingYear: 1, reportingQuarter: 1 });

    res.status(200).json({
      success: true,
      data: kpis
    });
  } catch (error) {
    next(error);
  }
};

const getValuationAnalytics = async (req, res, next) => {
  try {
    const { fundId } = req.query;
    const filter = fundId ? { fundId } : {};

    const valuations = await Valuation.find(filter)
      .populate('companyId', 'name industry initialInvestmentAmount')
      .populate('fundId', 'name identifier')
      .sort({ reportingYear: -1, reportingQuarter: -1 });

    res.status(200).json({
      success: true,
      count: valuations.length,
      data: valuations
    });
  } catch (error) {
    next(error);
  }
};

const getComparison = async (req, res, next) => {
  try {
    const { companyId, quarter = 'Q3', year = '2026' } = req.query;
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'companyId query parameter is required'
      });
    }

    const comparisonData = await compareQuarterlyPerformance(
      companyId,
      quarter,
      parseInt(year, 10)
    );

    res.status(200).json({
      success: true,
      data: comparisonData
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getKPIAnalytics,
  getValuationAnalytics,
  getComparison
};

