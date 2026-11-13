const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/dashboard', analyticsController.getDashboard);
router.get('/kpis', analyticsController.getKPIAnalytics);
router.get('/valuations', analyticsController.getValuationAnalytics);
router.get('/comparison', analyticsController.getComparison);

module.exports = router;

