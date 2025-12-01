const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function migrate() {
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  try {
    await client.connect();
    console.log('Connected to database for migration...');

    // 1. Add columns to users table if they don't exist
    console.log('Updating users table...');
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS patronymic VARCHAR(100),
      ADD COLUMN IF NOT EXISTS passport_series VARCHAR(20),
      ADD COLUMN IF NOT EXISTS passport_number VARCHAR(20),
      ADD COLUMN IF NOT EXISTS citizenship VARCHAR(100);
    `);

    // 2. Create user_skills table
    console.log('Creating user_skills table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_skills (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        skill_name VARCHAR(100) NOT NULL,
        level VARCHAR(20) DEFAULT 'intermediate', -- beginner, intermediate, fluent
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, skill_name) -- Prevent duplicate skills for same user
      );
    `);

    // 3. Create user_languages table (if we want to store languages separately from skills, 
    // or we can treat them as skills. Let's create a separate one as in the UI they are distinct)
    console.log('Creating user_languages table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_languages (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        language_name VARCHAR(50) NOT NULL,
        level VARCHAR(20) DEFAULT 'intermediate',
        UNIQUE(user_id, language_name)
      );
    `);

    console.log('Migration complete!');
    await client.end();

  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
