const express = require('express');
const router = express.Router();
const shiftsController = require('../controllers/shifts.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { validate, shiftSchema } = require('../middleware/validation.middleware');

router.use(authMiddleware);

router.get('/', shiftsController.getShifts);
router.post('/', validate(shiftSchema), shiftsController.createShift);
router.post('/:id/accept', shiftsController.acceptShift);
router.post('/:id/cancel', shiftsController.cancelShift);

module.exports = router;
