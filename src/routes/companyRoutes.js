const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const validate = require('../middleware/validateRequest');
const { createCompanySchema } = require('../validators');

router.use(protect);

router.get('/', companyController.getCompanies);
router.get('/:id', companyController.getCompanyById);
router.post('/', authorize('Admin', 'Analyst'), validate(createCompanySchema), companyController.createCompany);
router.put('/:id', authorize('Admin', 'Analyst'), companyController.updateCompany);
router.delete('/:id', authorize('Admin'), companyController.deleteCompany);

module.exports = router;

