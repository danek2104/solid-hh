const express = require('express');
const router = express.Router();
const db = require('../db');

// Apply for a job
router.post('/', async (req, res) => {
  const { job_id, user_id, cover_letter } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO applications (job_id, user_id, cover_letter) VALUES ($1, $2, $3) RETURNING *',
      [job_id, user_id, cover_letter]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
       return res.status(400).json({ error: 'You have already applied for this job' });
    }
    res.status(500).json({ error: 'Error submitting application' });
  }
});

// Get applications for a specific user (My Applications)
router.get('/user/:userId', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT a.*, j.title as job_title, j.location 
       FROM applications a 
       JOIN jobs j ON a.job_id = j.id 
       WHERE a.user_id = $1`,
      [req.params.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
