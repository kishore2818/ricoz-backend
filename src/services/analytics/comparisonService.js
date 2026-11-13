const ExtractedKPI = require('../../models/ExtractedKPI');
const Valuation = require('../../models/Valuation');
const PortfolioCompany = require('../../models/PortfolioCompany');
const Fund = require('../../models/Fund');
const Document = require('../../models/Document');
const Risk = require('../../models/Risk');

const getPreviousPeriod = (quarter, year) => {
  const qMap = { Q1: { q: 'Q4', y: year - 1 }, Q2: { q: 'Q1', y: year }, Q3: { q: 'Q2', y: year }, Q4: { q: 'Q3', y: year } };
  return qMap[quarter] || { q: 'Q2', y: year };
};

/**
 * Compares company performance across two quarters
 */
const compareQuarterlyPerformance = async (companyId, currentQuarter, currentYear) => {
  const prevPeriod = getPreviousPeriod(currentQuarter, currentYear);

  const [currentKPIs, prevKPIs, currentVal, prevVal] = await Promise.all([
    ExtractedKPI.find({ companyId, reportingQuarter: currentQuarter, reportingYear: currentYear }),
    ExtractedKPI.find({ companyId, reportingQuarter: prevPeriod.q, reportingYear: prevPeriod.y }),
    Valuation.findOne({ companyId, reportingQuarter: currentQuarter, reportingYear: currentYear }),
    Valuation.findOne({ companyId, reportingQuarter: prevPeriod.q, reportingYear: prevPeriod.y })
  ]);

  const metricsToCompare = [
    'Revenue',
    'EBITDA',
    'Gross Profit',
    'Net Income',
    'Cash Balance',
    'Annual Recurring Revenue (ARR)',
    'Employee Count',
    'Customer Count'
  ];

  const comparisons = [];

  for (const metric of metricsToCompare) {
    const curItem = currentKPIs.find(k => k.metricName === metric);
    const prevItem = prevKPIs.find(k => k.metricName === metric);

    const curVal = curItem && curItem.extractedValue !== null ? Number(curItem.extractedValue) : null;
    const pVal = prevItem && prevItem.extractedValue !== null ? Number(prevItem.extractedValue) : null;

    let absDiff = null;
    let pctChange = null;
    let indicator = 'neutral';

    if (curVal !== null && pVal !== null) {
      absDiff = Math.round((curVal - pVal) * 100) / 100;
      if (pVal !== 0) {
        pctChange = Math.round(((curVal - pVal) / Math.abs(pVal)) * 10000) / 100;
      }
      if (absDiff > 0) indicator = 'positive';
      else if (absDiff < 0) indicator = 'negative';
    }

    comparisons.push({
      metricName: metric,
      currentQuarter: `${currentQuarter} ${currentYear}`,
      currentValue: curVal,
      previousQuarter: `${prevPeriod.q} ${prevPeriod.y}`,
      previousValue: pVal,
      absoluteDifference: absDiff,
      percentageChange: pctChange,
      unitOrCurrency: curItem ? curItem.unitOrCurrency : 'USD',
      indicator
    });
  }

  // Include Valuation comparison
  const cVal = currentVal ? currentVal.currentValuation : null;
  const pVal = prevVal ? prevVal.currentValuation : (currentVal ? currentVal.previousValuation : null);
  let valAbsDiff = null;
  let valPctChange = null;
  let valIndicator = 'neutral';

  if (cVal !== null && pVal !== null) {
    valAbsDiff = Math.round((cVal - pVal) * 100) / 100;
    if (pVal !== 0) {
      valPctChange = Math.round(((cVal - pVal) / Math.abs(pVal)) * 10000) / 100;
    }
    if (valAbsDiff > 0) valIndicator = 'positive';
    else if (valAbsDiff < 0) valIndicator = 'negative';
  }

  comparisons.push({
    metricName: 'Company Valuation',
    currentQuarter: `${currentQuarter} ${currentYear}`,
    currentValue: cVal,
    previousQuarter: `${prevPeriod.q} ${prevPeriod.y}`,
    previousValue: pVal,
    absoluteDifference: valAbsDiff,
    percentageChange: valPctChange,
    unitOrCurrency: 'USD',
    indicator: valIndicator
  });

  return {
    companyId,
    currentPeriod: `${currentQuarter} ${currentYear}`,
    previousPeriod: `${prevPeriod.q} ${prevPeriod.y}`,
    comparisons
  };
};

/**
 * Aggregates dashboard metrics from MongoDB
 */
const getDashboardMetrics = async () => {
  const [
    totalFunds,
    totalCompanies,
    totalDocuments,
    pendingProcessingDocs,
    needsReviewDocs,
    completedDocs,
    highRisks,
    allValuations,
    revenueKPIs,
    recentDocs,
    recentRisks
  ] = await Promise.all([
    Fund.countDocuments(),
    PortfolioCompany.countDocuments(),
    Document.countDocuments(),
    Document.countDocuments({ status: { $in: ['Uploaded', 'Pending', 'Processing'] } }),
    Document.countDocuments({ status: 'Needs Review' }),
    Document.countDocuments({ status: 'Completed' }),
    Risk.countDocuments({ severity: 'High' }),
    Valuation.find().sort({ reportingYear: -1, reportingQuarter: -1 }),
    ExtractedKPI.find({ metricName: 'Revenue', extractedValue: { $ne: null } }),
    Document.find().populate('companyId', 'name industry').populate('fundId', 'name identifier').sort({ createdAt: -1 }).limit(5),
    Risk.find().populate('companyId', 'name').sort({ createdAt: -1 }).limit(5)
  ]);

  // Aggregate portfolio revenue
  let totalRevenue = 0;
  revenueKPIs.forEach(k => {
    if (typeof k.extractedValue === 'number') {
      totalRevenue += k.extractedValue;
    }
  });

  // Calculate total valuation and valuation changes
  let totalCurrentValuation = 0;
  let totalValuationChange = 0;
  const companyLatestValuation = new Map();

  allValuations.forEach(v => {
    const cid = v.companyId.toString();
    if (!companyLatestValuation.has(cid)) {
      companyLatestValuation.set(cid, v);
      totalCurrentValuation += v.currentValuation || 0;
      totalValuationChange += v.valuationChange || 0;
    }
  });

  // Calculate average revenue growth from valuation growth or revenue comparisons
  let avgRevenueGrowth = 0;
  if (companyLatestValuation.size > 0) {
    let growthSum = 0;
    companyLatestValuation.forEach(v => {
      growthSum += v.valuationGrowthPercent || 0;
    });
    avgRevenueGrowth = Math.round((growthSum / companyLatestValuation.size) * 100) / 100;
  }

  return {
    totalFunds,
    totalCompanies,
    totalDocuments,
    pendingProcessingDocs,
    needsReviewDocs,
    completedDocs,
    totalPortfolioRevenue: totalRevenue,
    totalValuation: totalCurrentValuation,
    totalValuationChange,
    avgRevenueGrowth,
    highRiskCount: highRisks,
    recentDocuments: recentDocs,
    recentRisks
  };
};

module.exports = {
  compareQuarterlyPerformance,
  getDashboardMetrics,
  getPreviousPeriod
};

