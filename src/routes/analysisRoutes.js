const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/company/:companyId', analysisController.getAnalysisByCompanyId);
router.get('/document/:documentId', analysisController.getAnalysisByDocumentId);
router.post('/document/:documentId', authorize('Admin', 'Analyst'), analysisController.triggerAnalysisForDocument);

module.exports = router;

