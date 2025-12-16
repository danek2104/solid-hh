const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper function to resolve skill IDs from names (and create new ones)
async function resolveSkillIds(skillNames) {
    const ids = [];
    if (!skillNames || !Array.isArray(skillNames)) return ids;

    for (const name of skillNames) {
        if (!name) continue;
        // Check if exists
        let res = await db.query('SELECT id FROM skills WHERE name = $1', [name]);
        if (res.rows.length > 0) {
            ids.push(res.rows[0].id);
        } else {
            // Create
            res = await db.query('INSERT INTO skills (name) VALUES ($1) RETURNING id', [name]);
            ids.push(res.rows[0].id);
        }
    }
    return ids;
}

// Get all jobs
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT j.*, 
             COALESCE(
               (SELECT json_agg(s.name) 
                FROM job_skills js 
                JOIN skills s ON js.skill_id = s.id
                WHERE js.job_id = j.id), 
               '[]'::json
             ) as skills
      FROM jobs j 
      WHERE j.is_active = true 
      ORDER BY j.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new job
router.post('/', async (req, res) => {
  const { title, description, salary_min, salary_max, location, employer_id, skills } = req.body;
  
  try {
    await db.query('BEGIN');

    const result = await db.query(
      'INSERT INTO jobs (title, description, salary_min, salary_max, location, employer_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, description, salary_min, salary_max, location, employer_id]
    );
    const job = result.rows[0];

    // Insert Skills
    if (skills && Array.isArray(skills)) {
        const skillIds = await resolveSkillIds(skills);
        for (const skillId of skillIds) {
            await db.query(
                'INSERT INTO job_skills (job_id, skill_id) VALUES ($1, $2)',
                [job.id, skillId]
            );
        }
    }
    
    await db.query('COMMIT');
    res.status(201).json(job);
  } catch (err) {
    await db.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Error creating job' });
  }
});

// Get job details
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT j.*, 
              COUNT(a.id)::int as application_count,
              COALESCE(
                (SELECT json_agg(s.name) 
                 FROM job_skills js 
                 JOIN skills s ON js.skill_id = s.id
                 WHERE js.job_id = j.id), 
                '[]'::json
              ) as skills
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
      `SELECT j.*, 
              COUNT(a.id)::int as application_count,
              COALESCE(
                (SELECT json_agg(s.name) 
                 FROM job_skills js 
                 JOIN skills s ON js.skill_id = s.id
                 WHERE js.job_id = j.id), 
                '[]'::json
              ) as skills
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
  const { title, description, salary_min, salary_max, location, is_active, skills } = req.body;
  const id = req.params.id;

  try {
    await db.query('BEGIN');
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
      await db.query('ROLLBACK');
      return res.status(404).json({ error: 'Job not found' });
    }

    // Update Skills if provided
    if (skills !== undefined && Array.isArray(skills)) {
         // Clear existing
         await db.query('DELETE FROM job_skills WHERE job_id = $1', [id]);
         
         // Add new
         const skillIds = await resolveSkillIds(skills);
         for (const skillId of skillIds) {
            await db.query(
                'INSERT INTO job_skills (job_id, skill_id) VALUES ($1, $2)',
                [id, skillId]
            );
         }
    }
    
    await db.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await db.query('ROLLBACK');
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