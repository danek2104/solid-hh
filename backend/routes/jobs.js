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
    const result = await db.query(
      `SELECT j.*, COUNT(a.id)::int as application_count 
       FROM jobs j 
       LEFT JOIN applications a ON j.id = a.job_id 
       WHERE j.id = $1 
       GROUP BY j.id`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get jobs by employer ID
router.get('/employer/:employerId', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT j.*, COUNT(a.id)::int as application_count 
       FROM jobs j 
       LEFT JOIN applications a ON j.id = a.job_id 
       WHERE j.employer_id = $1 
       GROUP BY j.id 
       ORDER BY j.created_at DESC`,
      [req.params.employerId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a job (Edit or Toggle Status)
router.put('/:id', async (req, res) => {
  const { title, description, salary_min, salary_max, location, is_active } = req.body;
  const id = req.params.id;

  try {
    const result = await db.query(
      `UPDATE jobs 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           salary_min = COALESCE($3, salary_min),
           salary_max = COALESCE($4, salary_max),
           location = COALESCE($5, location),
           is_active = COALESCE($6, is_active)
       WHERE id = $7
       RETURNING *`,
      [title, description, salary_min, salary_max, location, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error updating job' });
  }
});

// Delete a job
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM jobs WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json({ message: 'Job deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error deleting job' });
  }
});

module.exports = router;
