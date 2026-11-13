const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const validate = require('../middleware/validateRequest');
const { registerSchema, loginSchema } = require('../validators');

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', protect, authController.getMe);
router.get('/users', protect, authorize('Admin'), authController.getAllUsers);

module.exports = router;

