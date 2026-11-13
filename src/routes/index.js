const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const fundRoutes = require('./fundRoutes');
const companyRoutes = require('./companyRoutes');
const documentRoutes = require('./documentRoutes');
const analysisRoutes = require('./analysisRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const reviewRoutes = require('./reviewRoutes');
const reportRoutes = require('./reportRoutes');

router.use('/auth', authRoutes);
router.use('/funds', fundRoutes);
router.use('/companies', companyRoutes);
router.use('/documents', documentRoutes);
router.use('/analysis', analysisRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/reviews', reviewRoutes);
router.use('/reports', reportRoutes);

module.exports = router;

