const express = require('express');
const router = express.Router();
const reviewsController = require('../controllers/reviews.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/', reviewsController.getReviews);
router.post('/', reviewsController.createReview);

module.exports = router;
