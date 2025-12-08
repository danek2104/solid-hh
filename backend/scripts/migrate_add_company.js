const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function migrate() {
    try {
        console.log("Adding company_name to users table...");
        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);
        `);
        console.log("Migration successful");
    } catch (e) {
        console.error("Migration failed", e);
    } finally {
        pool.end();
    }
}

migrate();
