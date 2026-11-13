const Fund = require('../models/Fund');
const PortfolioCompany = require('../models/PortfolioCompany');
const { logAudit } = require('../utils/auditLogger');

const getFunds = async (req, res, next) => {
  try {
    const funds = await Fund.find().sort({ createdAt: -1 });
    // Count associated portfolio companies for each fund
    const enrichedFunds = await Promise.all(
      funds.map(async (fund) => {
        const companyCount = await PortfolioCompany.countDocuments({ fundId: fund._id });
        return {
          ...fund.toObject(),
          companyCount
        };
      })
    );

    res.status(200).json({
      success: true,
      count: enrichedFunds.length,
      data: enrichedFunds
    });
  } catch (error) {
    next(error);
  }
};

const getFundById = async (req, res, next) => {
  try {
    const fund = await Fund.findById(req.params.id);
    if (!fund) {
      return res.status(404).json({ success: false, message: 'Fund not found' });
    }
    const companies = await PortfolioCompany.find({ fundId: fund._id });
    res.status(200).json({
      success: true,
      data: {
        ...fund.toObject(),
        companies
      }
    });
  } catch (error) {
    next(error);
  }
};

const createFund = async (req, res, next) => {
  try {
    const fund = await Fund.create(req.body);
    await logAudit({
      userId: req.user._id,
      action: 'CREATE',
      entityType: 'Fund',
      entityId: fund._id,
      correctedValue: fund.toObject(),
      reason: 'Initial fund creation',
      req
    });

    res.status(201).json({
      success: true,
      message: 'Fund created successfully',
      data: fund
    });
  } catch (error) {
    next(error);
  }
};

const updateFund = async (req, res, next) => {
  try {
    const fund = await Fund.findById(req.params.id);
    if (!fund) {
      return res.status(404).json({ success: false, message: 'Fund not found' });
    }

    const original = fund.toObject();
    Object.assign(fund, req.body);
    await fund.save();

    await logAudit({
      userId: req.user._id,
      action: 'UPDATE',
      entityType: 'Fund',
      entityId: fund._id,
      originalValue: original,
      correctedValue: fund.toObject(),
      reason: 'Fund update',
      req
    });

    res.status(200).json({
      success: true,
      message: 'Fund updated successfully',
      data: fund
    });
  } catch (error) {
    next(error);
  }
};

const deleteFund = async (req, res, next) => {
  try {
    const fund = await Fund.findById(req.params.id);
    if (!fund) {
      return res.status(404).json({ success: false, message: 'Fund not found' });
    }

    // Check if companies exist
    const hasCompanies = await PortfolioCompany.exists({ fundId: fund._id });
    if (hasCompanies) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete fund with associated portfolio companies. Reassign or delete companies first.'
      });
    }

    await fund.deleteOne();
    await logAudit({
      userId: req.user._id,
      action: 'DELETE',
      entityType: 'Fund',
      entityId: fund._id,
      originalValue: fund.toObject(),
      reason: 'Fund deletion by admin',
      req
    });

    res.status(200).json({
      success: true,
      message: 'Fund deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFunds,
  getFundById,
  createFund,
  updateFund,
  deleteFund
};

