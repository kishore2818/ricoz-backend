const PortfolioCompany = require('../models/PortfolioCompany');
const Document = require('../models/Document');
const ExtractedKPI = require('../models/ExtractedKPI');
const Valuation = require('../models/Valuation');
const { logAudit } = require('../utils/auditLogger');

const getCompanies = async (req, res, next) => {
  try {
    const { fundId } = req.query;
    const filter = fundId ? { fundId } : {};

    const companies = await PortfolioCompany.find(filter)
      .populate('fundId', 'name identifier vintageYear')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: companies.length,
      data: companies
    });
  } catch (error) {
    next(error);
  }
};

const getCompanyById = async (req, res, next) => {
  try {
    const company = await PortfolioCompany.findById(req.params.id).populate('fundId');
    if (!company) {
      return res.status(404).json({ success: false, message: 'Portfolio company not found' });
    }

    const [documents, kpis, valuations] = await Promise.all([
      Document.find({ companyId: company._id }).sort({ reportingYear: -1, reportingQuarter: -1 }),
      ExtractedKPI.find({ companyId: company._id }).sort({ reportingYear: -1, reportingQuarter: -1 }),
      Valuation.find({ companyId: company._id }).sort({ reportingYear: -1, reportingQuarter: -1 })
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...company.toObject(),
        documents,
        kpis,
        valuations
      }
    });
  } catch (error) {
    next(error);
  }
};

const createCompany = async (req, res, next) => {
  try {
    const company = await PortfolioCompany.create(req.body);
    await logAudit({
      userId: req.user._id,
      action: 'CREATE',
      entityType: 'PortfolioCompany',
      entityId: company._id,
      correctedValue: company.toObject(),
      reason: 'New company onboarded',
      req
    });

    res.status(201).json({
      success: true,
      message: 'Portfolio company added successfully',
      data: company
    });
  } catch (error) {
    next(error);
  }
};

const updateCompany = async (req, res, next) => {
  try {
    const company = await PortfolioCompany.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Portfolio company not found' });
    }

    const original = company.toObject();
    Object.assign(company, req.body);
    await company.save();

    await logAudit({
      userId: req.user._id,
      action: 'UPDATE',
      entityType: 'PortfolioCompany',
      entityId: company._id,
      originalValue: original,
      correctedValue: company.toObject(),
      reason: 'Portfolio company details updated',
      req
    });

    res.status(200).json({
      success: true,
      message: 'Portfolio company updated successfully',
      data: company
    });
  } catch (error) {
    next(error);
  }
};

const deleteCompany = async (req, res, next) => {
  try {
    const company = await PortfolioCompany.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Portfolio company not found' });
    }

    await company.deleteOne();
    await logAudit({
      userId: req.user._id,
      action: 'DELETE',
      entityType: 'PortfolioCompany',
      entityId: company._id,
      originalValue: company.toObject(),
      reason: 'Portfolio company deleted',
      req
    });

    res.status(200).json({
      success: true,
      message: 'Portfolio company deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany
};

