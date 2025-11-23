const express = require('express');
const router = express.Router();
const documentsController = require('../controllers/documents.controller');
const authMiddleware = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.use(authMiddleware);

router.get('/', documentsController.getDocuments);
router.post('/', upload.single('file'), documentsController.uploadDocument);
router.post('/photos', upload.single('photo'), documentsController.uploadDocument); // Alias for photo uploads
router.delete('/:id', documentsController.deleteDocument);

module.exports = router;
