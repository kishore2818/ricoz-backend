const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const validate = require('../middleware/validateRequest');
const { generateReportSchema } = require('../validators');

router.use(protect);

router.post('/generate', authorize('Admin', 'Analyst', 'Reviewer'), validate(generateReportSchema), reportController.generateReport);
router.get('/', reportController.getReports);
router.get('/:id', reportController.getReportById);
router.get('/:id/download', reportController.downloadReport);

module.exports = router;

