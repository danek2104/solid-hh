const express = require('express');
const router = express.Router();
const chatsController = require('../controllers/chats.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/', chatsController.getChats);
router.post('/', chatsController.createChat); // To start a new conversation
router.get('/:id/messages', chatsController.getChatMessages);
router.post('/:id/messages', chatsController.sendMessage);

module.exports = router;
