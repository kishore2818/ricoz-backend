const Document = require('../../models/Document');
const PortfolioCompany = require('../../models/PortfolioCompany');
const Fund = require('../../models/Fund');
const ExtractedKPI = require('../../models/ExtractedKPI');
const Valuation = require('../../models/Valuation');
const OperationalInsight = require('../../models/OperationalInsight');
const Risk = require('../../models/Risk');
const QuarterlyAnalysis = require('../../models/QuarterlyAnalysis');
const { parseDocument } = require('../document/fileParserService');
const { extractFromDocument } = require('../ai/llmService');

/**
 * Executes full extraction pipeline for a given document
 */
const processDocumentExtraction = async (documentId, userId) => {
  const doc = await Document.findById(documentId);
  if (!doc) {
    throw new Error('Document not found');
  }

  const company = await PortfolioCompany.findById(doc.companyId);
  if (!company) {
    throw new Error('Associated portfolio company not found');
  }

  // Set status to Processing
  doc.status = 'Processing';
  doc.errorMessage = null;
  await doc.save();

  try {
    // 1. Parse raw text and tables
    const parseResult = await parseDocument(doc.filePath, doc.mimeType, doc.originalName);
    doc.pageCount = parseResult.pageCount;
    doc.isScanned = parseResult.isScanned;
    doc.extractedTextPreview = parseResult.preview;

    // 2. Extract structured data via AI / Deterministic Engine
    const extractedData = await extractFromDocument({
      documentText: parseResult.text,
      companyName: company.name,
      reportingQuarter: doc.reportingQuarter,
      reportingYear: doc.reportingYear
    });

    // 3. Clear previous extractions for this document to avoid duplicates on re-processing
    await ExtractedKPI.deleteMany({ documentId: doc._id });
    await OperationalInsight.deleteMany({ documentId: doc._id });
    await Risk.deleteMany({ documentId: doc._id });

    // 4. Persist Extracted KPIs
    const kpiDocs = [];
    if (Array.isArray(extractedData.kpis)) {
      for (const k of extractedData.kpis) {
        kpiDocs.push({
          documentId: doc._id,
          companyId: company._id,
          fundId: doc.fundId,
          reportingQuarter: doc.reportingQuarter,
          reportingYear: doc.reportingYear,
          metricName: k.metricName,
          category: k.category || 'Financial',
          extractedValue: k.extractedValue !== undefined ? k.extractedValue : null,
          unitOrCurrency: k.unitOrCurrency || 'USD',
          isCalculated: k.isCalculated || false,
          sourceDocumentName: doc.originalName,
          sourcePageNumber: k.sourcePageNumber || 1,
          sourceSnippet: k.sourceSnippet || '',
          confidence: k.confidence !== undefined ? k.confidence : 0.95,
          verificationStatus: 'Pending'
        });
      }
    }

    // Auto-calculate margins if values exist (strictly marking isCalculated: true)
    const revObj = kpiDocs.find(k => k.metricName === 'Revenue' && k.extractedValue !== null);
    const ebitdaObj = kpiDocs.find(k => k.metricName === 'EBITDA' && k.extractedValue !== null);
    const gpObj = kpiDocs.find(k => k.metricName === 'Gross Profit' && k.extractedValue !== null);

    if (revObj && revObj.extractedValue > 0) {
      if (ebitdaObj) {
        const ebitdaMargin = Math.round((ebitdaObj.extractedValue / revObj.extractedValue) * 10000) / 100;
        kpiDocs.push({
          documentId: doc._id,
          companyId: company._id,
          fundId: doc.fundId,
          reportingQuarter: doc.reportingQuarter,
          reportingYear: doc.reportingYear,
          metricName: 'EBITDA Margin',
          category: 'Financial',
          extractedValue: ebitdaMargin,
          unitOrCurrency: '%',
          isCalculated: true,
          sourceDocumentName: doc.originalName,
          sourcePageNumber: 1,
          sourceSnippet: `Calculated: EBITDA ($${ebitdaObj.extractedValue}) / Revenue ($${revObj.extractedValue})`,
          confidence: 0.99,
          verificationStatus: 'Pending'
        });
      }
      if (gpObj) {
        const grossMargin = Math.round((gpObj.extractedValue / revObj.extractedValue) * 10000) / 100;
        kpiDocs.push({
          documentId: doc._id,
          companyId: company._id,
          fundId: doc.fundId,
          reportingQuarter: doc.reportingQuarter,
          reportingYear: doc.reportingYear,
          metricName: 'Gross Margin',
          category: 'Financial',
          extractedValue: grossMargin,
          unitOrCurrency: '%',
          isCalculated: true,
          sourceDocumentName: doc.originalName,
          sourcePageNumber: 1,
          sourceSnippet: `Calculated: Gross Profit ($${gpObj.extractedValue}) / Revenue ($${revObj.extractedValue})`,
          confidence: 0.99,
          verificationStatus: 'Pending'
        });
      }
    }

    if (kpiDocs.length > 0) {
      await ExtractedKPI.insertMany(kpiDocs);
    }

    // 5. Valuation Calculation & Storage
    let currentVal = extractedData.valuation && extractedData.valuation.currentValuation !== null
      ? extractedData.valuation.currentValuation
      : company.currentValuation;

    let previousVal = extractedData.valuation && extractedData.valuation.previousValuation !== null
      ? extractedData.valuation.previousValuation
      : null;

    // If previousValuation not in report, fetch from prior quarter's record or default to initial
    if (previousVal === null) {
      const priorValRecord = await Valuation.findOne({
        companyId: company._id,
        $or: [
          { reportingYear: doc.reportingYear - 1 },
          { reportingYear: doc.reportingYear, reportingQuarter: { $ne: doc.reportingQuarter } }
        ]
      }).sort({ reportingYear: -1, reportingQuarter: -1 });

      previousVal = priorValRecord ? priorValRecord.currentValuation : company.initialInvestmentAmount;
    }

    const valChange = currentVal && previousVal !== null ? currentVal - previousVal : 0;
    const valGrowthPct = previousVal && previousVal > 0 ? ((valChange / previousVal) * 100) : 0;

    await Valuation.findOneAndUpdate(
      {
        companyId: company._id,
        reportingQuarter: doc.reportingQuarter,
        reportingYear: doc.reportingYear
      },
      {
        fundId: doc.fundId,
        initialInvestmentAmount: company.initialInvestmentAmount,
        previousValuation: previousVal,
        currentValuation: currentVal,
        valuationChange: Math.round(valChange * 100) / 100,
        valuationGrowthPercent: Math.round(valGrowthPct * 100) / 100,
        currentInvestmentValue: currentVal,
        currency: company.currency || 'USD',
        sourceDocumentId: doc._id,
        verificationStatus: 'Pending'
      },
      { upsert: true, new: true }
    );

    // Update company's live valuation in master record
    company.currentValuation = currentVal;
    company.reportingStatus = 'Up to Date';
    await company.save();

    // 6. Persist Operational Insights
    if (Array.isArray(extractedData.narratives)) {
      const narrativeDocs = extractedData.narratives.map(n => ({
        documentId: doc._id,
        companyId: company._id,
        fundId: doc.fundId,
        reportingQuarter: doc.reportingQuarter,
        reportingYear: doc.reportingYear,
        section: n.section,
        sectionTitle: n.sectionTitle,
        summaryText: n.summaryText,
        supportingEvidence: n.supportingEvidence || '',
        sourcePage: n.sourcePage || 1,
        isApproved: false
      }));
      await OperationalInsight.insertMany(narrativeDocs);
    }

    // 7. Persist Risks
    if (Array.isArray(extractedData.risks)) {
      const riskDocs = extractedData.risks.map(r => ({
        documentId: doc._id,
        companyId: company._id,
        fundId: doc.fundId,
        reportingQuarter: doc.reportingQuarter,
        reportingYear: doc.reportingYear,
        title: r.title,
        description: r.description,
        category: r.category || 'Operational',
        severity: r.severity || 'Medium',
        supportingEvidence: r.supportingEvidence || '',
        sourceDocument: doc.originalName,
        sourcePage: r.sourcePage || 1,
        recommendedAction: r.recommendedAction || 'Monitor closely during weekly management sync.',
        status: 'Flagged'
      }));
      await Risk.insertMany(riskDocs);
    }

    // 8. Create or update QuarterlyAnalysis summary record
    await QuarterlyAnalysis.findOneAndUpdate(
      {
        companyId: company._id,
        reportingQuarter: doc.reportingQuarter,
        reportingYear: doc.reportingYear
      },
      {
        fundId: doc.fundId,
        documentId: doc._id,
        status: 'Needs Review',
        executiveSummary: extractedData.narratives && extractedData.narratives[0] ? extractedData.narratives[0].summaryText : `${company.name} completed ${doc.reportingQuarter} ${doc.reportingYear} operational period.`,
        financialHighlights: kpiDocs.filter(k => k.extractedValue !== null).map(k => `${k.metricName}: ${k.unitOrCurrency === 'USD' ? '$' : ''}${Number(k.extractedValue).toLocaleString()} ${k.unitOrCurrency !== 'USD' ? k.unitOrCurrency : ''}`),
        operationalHighlights: (extractedData.narratives || []).slice(0, 3).map(n => `${n.sectionTitle}: ${n.summaryText}`)
      },
      { upsert: true, new: true }
    );

    doc.status = 'Needs Review';
    await doc.save();

    return {
      success: true,
      documentId: doc._id,
      kpisExtracted: kpiDocs.length,
      narrativesExtracted: extractedData.narratives ? extractedData.narratives.length : 0,
      risksIdentified: extractedData.risks ? extractedData.risks.length : 0
    };
  } catch (error) {
    console.error(`[Extraction Error] Failed processing document ${doc._id}:`, error);
    doc.status = 'Failed';
    doc.errorMessage = error.message;
    await doc.save();
    throw error;
  }
};

module.exports = {
  processDocumentExtraction
};

