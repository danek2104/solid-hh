const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const documentsController = require('../controllers/documents.controller'); // Reuse for avatar
const authMiddleware = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.use(authMiddleware); // Protect all profile routes

router.get('/', profileController.getProfile);
router.post('/', profileController.updateProfile); // Using POST for updates per API contract
router.post('/avatar', upload.single('avatar'), documentsController.uploadAvatar);
router.get('/documents/status', profileController.getDocumentsStatus);

module.exports = router;
