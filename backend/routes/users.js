const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all users (for admin/testing)
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT id, first_name, last_name, email, role FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register a new user
router.post('/register', async (req, res) => {
  const { first_name, last_name, email, password, phone } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO users (first_name, last_name, email, password_hash, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id, first_name, email',
      [first_name, last_name, email, password, phone]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error registering user' });
  }
});

// Login with phone (Simple version for MVP)
router.post('/login', async (req, res) => {
  const { phone } = req.body;
  try {
    let user;
    const result = await db.query('SELECT * FROM users WHERE phone = $1', [phone]);

    if (result.rows.length === 0) {
      // User not found, create a new one (auto-registration)
      const defaultFirstName = 'Новый'; // Default name for new users
      const defaultEmail = `${phone}@example.com`; // Placeholder email
      const defaultPasswordHash = 'temp_password_hash'; // Placeholder password hash
      const defaultRole = 'seeker'; // Default role

      const insertResult = await db.query(
        'INSERT INTO users (first_name, email, password_hash, phone, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [defaultFirstName, defaultEmail, defaultPasswordHash, phone, defaultRole]
      );
      user = insertResult.rows[0];
    } else {
      user = result.rows[0];
    }
    
    // Fetch languages
    const languagesRes = await db.query('SELECT language_name as name, level FROM user_languages WHERE user_id = $1', [user.id]);
    user.languages = languagesRes.rows;

    // Fetch skills
    const skillsRes = await db.query('SELECT skill_name FROM user_skills WHERE user_id = $1', [user.id]);
    user.skills = skillsRes.rows.map(row => row.skill_name);

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = result.rows[0];
    
    // Fetch languages
    const languagesRes = await db.query('SELECT language_name as name, level FROM user_languages WHERE user_id = $1', [req.params.id]);
    user.languages = languagesRes.rows;

    // Fetch skills
    const skillsRes = await db.query('SELECT skill_name FROM user_skills WHERE user_id = $1', [req.params.id]);
    user.skills = skillsRes.rows.map(row => row.skill_name);

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/:id', async (req, res) => {
  const { 
    first_name, last_name, patronymic, 
    email, phone, 
    citizenship, passport_series, passport_number,
    role, 
    company_name, 
    avatar_url, // New field
    company_description,
    website,
    city,
    has_migration_card,
    has_patent,
    languages, 
    skills 
  } = req.body;
  
  try {
    // 1. Update User Table
    const result = await db.query(
      `UPDATE users 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           patronymic = COALESCE($3, patronymic),
           email = COALESCE($4, email),
           phone = COALESCE($5, phone),
           citizenship = COALESCE($6, citizenship),
           passport_series = COALESCE($7, passport_series),
           passport_number = COALESCE($8, passport_number),
           role = COALESCE($9, role),
           company_name = COALESCE($10, company_name),
           avatar_url = COALESCE($11, avatar_url),
           company_description = COALESCE($12, company_description),
           website = COALESCE($13, website),
           city = COALESCE($14, city),
           has_migration_card = COALESCE($15, has_migration_card),
           has_patent = COALESCE($16, has_patent)
       WHERE id = $17
       RETURNING *`,
      [first_name, last_name, patronymic, email, phone, citizenship, passport_series, passport_number, role, company_name, avatar_url, company_description, website, city, has_migration_card, has_patent, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const updatedUser = result.rows[0];

    // 2. Update Languages
    if (Array.isArray(languages)) {
        await db.query('DELETE FROM user_languages WHERE user_id = $1', [req.params.id]);
        for (const lang of languages) {
            await db.query(
                'INSERT INTO user_languages (user_id, language_name, level) VALUES ($1, $2, $3)',
                [req.params.id, lang.name, lang.level]
            );
        }
        updatedUser.languages = languages;
    }

    // 3. Update Skills
    if (Array.isArray(skills)) {
        await db.query('DELETE FROM user_skills WHERE user_id = $1', [req.params.id]);
        for (const skill of skills) {
            await db.query(
                'INSERT INTO user_skills (user_id, skill_name) VALUES ($1, $2)',
                [req.params.id, skill]
            );
        }
        updatedUser.skills = skills;
    }

    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error updating user' });
  }
});

// RESET user profile (for demo purposes)
router.post('/:id/reset', async (req, res) => {
  try {
    // Clear basic info
    const result = await db.query(
      `UPDATE users 
       SET first_name = '',
           last_name = NULL,
           patronymic = NULL,
           citizenship = NULL,
           passport_series = NULL,
           passport_number = NULL
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );

    // Clear languages
    await db.query('DELETE FROM user_languages WHERE user_id = $1', [req.params.id]);
    // Clear skills
    await db.query('DELETE FROM user_skills WHERE user_id = $1', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error resetting user' });
  }
});

module.exports = router;