const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);

router.post('/upload', authorize('Admin', 'Analyst'), upload.single('file'), documentController.uploadDocument);
router.get('/', documentController.getDocuments);
router.get('/:id', documentController.getDocumentById);
router.post('/:id/process', authorize('Admin', 'Analyst'), documentController.processDocument);
router.delete('/:id', authorize('Admin'), documentController.deleteDocument);

module.exports = router;

