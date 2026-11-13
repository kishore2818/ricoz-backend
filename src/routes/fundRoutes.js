const express = require('express');
const router = express.Router();
const fundController = require('../controllers/fundController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const validate = require('../middleware/validateRequest');
const { createFundSchema } = require('../validators');

router.use(protect);

router.get('/', fundController.getFunds);
router.get('/:id', fundController.getFundById);
router.post('/', authorize('Admin'), validate(createFundSchema), fundController.createFund);
router.put('/:id', authorize('Admin'), fundController.updateFund);
router.delete('/:id', authorize('Admin'), fundController.deleteFund);

module.exports = router;

