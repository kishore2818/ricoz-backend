const User = require('../models/User');
const Fund = require('../models/Fund');
const PortfolioCompany = require('../models/PortfolioCompany');

const seedInitialData = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[Seeder] Initializing default users...');
      await User.create([
        {
          name: 'Sarah Jenkins (Admin)',
          email: 'admin@apexpe.com',
          password: 'Password123!',
          role: 'Admin',
          department: 'Executive Committee & Fund Operations'
        },
        {
          name: 'Marcus Vance (Analyst)',
          email: 'analyst@apexpe.com',
          password: 'Password123!',
          role: 'Analyst',
          department: 'Private Equity Investment & IR'
        },
        {
          name: 'Elena Rostova (Reviewer)',
          email: 'reviewer@apexpe.com',
          password: 'Password123!',
          role: 'Reviewer',
          department: 'Audit & Compliance Committee'
        }
      ]);
      console.log('[Seeder] Default users created.');
    }

    const fundCount = await Fund.countDocuments();
    if (fundCount === 0) {
      console.log('[Seeder] Initializing sample PE funds...');
      const fund = await Fund.create({
        name: 'Apex Horizon Growth Capital IV',
        identifier: 'APEX-IV-GROWTH',
        description: 'Mid-market technology, enterprise software, and healthcare tech buyout fund.',
        vintageYear: 2024,
        targetSize: 750000000,
        currency: 'USD',
        reportingPeriod: {
          quarter: 'Q3',
          year: 2026
        },
        status: 'Active'
      });

      console.log('[Seeder] Initializing sample Portfolio Companies...');
      await PortfolioCompany.create([
        {
          name: 'CloudSync Solutions',
          industry: 'Enterprise SaaS & Cloud Infrastructure',
          description: 'Provider of automated cross-cloud storage optimization and data pipelines.',
          investmentDate: new Date('2024-03-15'),
          initialInvestmentAmount: 45000000,
          currentValuation: 62000000,
          ownershipPercentage: 42.5,
          fundId: fund._id,
          reportingStatus: 'Pending Submission',
          currency: 'USD'
        },
        {
          name: 'BioPulse Diagnostics',
          industry: 'Healthcare Technology & AI Diagnostics',
          description: 'AI-assisted medical imaging and point-of-care pathology analytics.',
          investmentDate: new Date('2024-07-20'),
          initialInvestmentAmount: 38000000,
          currentValuation: 49500000,
          ownershipPercentage: 35.0,
          fundId: fund._id,
          reportingStatus: 'Pending Submission',
          currency: 'USD'
        },
        {
          name: 'NexPay Logistics Platform',
          industry: 'FinTech & B2B Supply Chain Payments',
          description: 'Global treasury automation and cross-border settlement rails for mid-market fleets.',
          investmentDate: new Date('2025-01-10'),
          initialInvestmentAmount: 52000000,
          currentValuation: 68000000,
          ownershipPercentage: 48.0,
          fundId: fund._id,
          reportingStatus: 'Pending Submission',
          currency: 'USD'
        }
      ]);
      console.log('[Seeder] Sample fund and companies created.');
    }
  } catch (err) {
    console.warn(`[Seeder Warning] Seeding bypassed or failed: ${err.message}`);
  }
};

module.exports = { seedInitialData };

