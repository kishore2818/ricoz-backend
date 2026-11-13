const { z } = require('zod');

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['Admin', 'Analyst', 'Reviewer']).optional(),
    department: z.string().optional()
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
  })
});

const createFundSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Fund name is required'),
    identifier: z.string().min(2, 'Identifier is required (e.g. PE-FUND-I)'),
    description: z.string().optional(),
    vintageYear: z.number().int().min(1980).max(2100),
    targetSize: z.number().nonnegative().optional(),
    currency: z.string().default('USD'),
    reportingPeriod: z.object({
      quarter: z.enum(['Q1', 'Q2', 'Q3', 'Q4']),
      year: z.number().int()
    }).optional()
  })
});

const createCompanySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Company name is required'),
    industry: z.string().min(2, 'Industry is required'),
    description: z.string().optional(),
    investmentDate: z.string(),
    initialInvestmentAmount: z.number().positive('Initial investment must be positive'),
    currentValuation: z.number().positive('Current valuation must be positive'),
    ownershipPercentage: z.number().min(0).max(100).optional(),
    fundId: z.string().min(1, 'Fund association is required'),
    currency: z.string().default('USD')
  })
});

const reviewCorrectionSchema = z.object({
  body: z.object({
    extractedValue: z.any().optional(),
    unitOrCurrency: z.string().optional(),
    verificationStatus: z.enum(['Verified', 'Corrected', 'Rejected']),
    reviewerNote: z.string().optional(),
    reason: z.string().optional()
  })
});

const generateReportSchema = z.object({
  body: z.object({
    fundId: z.string().min(1, 'Fund ID is required'),
    reportingQuarter: z.enum(['Q1', 'Q2', 'Q3', 'Q4']),
    reportingYear: z.number().int(),
    title: z.string().optional()
  })
});

module.exports = {
  registerSchema,
  loginSchema,
  createFundSchema,
  createCompanySchema,
  reviewCorrectionSchema,
  generateReportSchema
};

