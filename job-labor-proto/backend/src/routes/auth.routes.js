const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authLimiter } = require('../middleware/rateLimit.middleware');
const { validate, registerSchema, loginSchema } = require('../middleware/validation.middleware');

router.post('/auth', authLimiter, (req, res) => {
    const { mode } = req.body;
    if (mode === 'register') {
        // Validate and then call controller
        return validate(registerSchema)(req, res, () => authController.register(req, res));
    } else {
        return validate(loginSchema)(req, res, () => authController.login(req, res));
    }
});

router.post('/verify', authController.verify);
router.post('/refresh', authController.refresh);

module.exports = router;
