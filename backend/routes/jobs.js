const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all jobs
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM jobs WHERE is_active = true ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new job
router.post('/', async (req, res) => {
  const { title, description, salary_min, salary_max, location, employer_id } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO jobs (title, description, salary_min, salary_max, location, employer_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, description, salary_min, salary_max, location, employer_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creating job' });
  }
});

// Get job details
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM jobs WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
