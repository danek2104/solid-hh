const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function migrate() {
    try {
        console.log("Adding city and document flags to users table...");
        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS city VARCHAR(100),
            ADD COLUMN IF NOT EXISTS has_migration_card BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS has_patent BOOLEAN DEFAULT FALSE;
        `);
        console.log("Migration successful");
    } catch (e) {
        console.error("Migration failed", e);
    } finally {
        pool.end();
    }
}

migrate();
