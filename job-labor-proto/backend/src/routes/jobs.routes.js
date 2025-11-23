const express = require('express');
const router = express.Router();
const jobsController = require('../controllers/jobs.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { validate, jobSchema } = require('../middleware/validation.middleware');

router.get('/', jobsController.getJobs);
// Specific routes MUST be defined before parameterized routes (/:id)
router.get('/applications', authMiddleware, jobsController.getApplications);
router.post('/apply', authMiddleware, jobsController.applyForJob);

router.get('/:id', jobsController.getJobById);
router.post('/', authMiddleware, validate(jobSchema), jobsController.createJob);

module.exports = router;
