const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all skills (or search)
router.get('/', async (req, res) => {
  const { query } = req.query;
  try {
    let sql = 'SELECT * FROM skills';
    const params = [];
    if (query) {
      sql += ' WHERE name ILIKE $1';
      params.push(`%${query}%`);
    }
    sql += ' ORDER BY name ASC';
    const result = await db.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new skill
router.post('/', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  try {
    // Check if exists (case insensitive for safety?) - Keeping exact match for now
    const check = await db.query('SELECT * FROM skills WHERE name = $1', [name]);
    if (check.rows.length > 0) {
      return res.json(check.rows[0]);
    }

    const result = await db.query(
      'INSERT INTO skills (name) VALUES ($1) RETURNING *',
      [name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creating skill' });
  }
});

module.exports = router;
