const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/pending', reviewController.getPendingReviews);
router.put('/kpi/:id', authorize('Admin', 'Reviewer', 'Analyst'), reviewController.updateKPIReview);
router.post('/analysis/:id/approve', authorize('Admin', 'Reviewer'), reviewController.approveQuarterlyAnalysis);
router.post('/analysis/:id/reject', authorize('Admin', 'Reviewer'), reviewController.rejectQuarterlyAnalysis);

module.exports = router;

