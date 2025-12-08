require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../db');

async function migrate() {
  try {
    console.log('Migrating: Adding notes column to applications table...');
    
    await db.query(`
      ALTER TABLE applications 
      ADD COLUMN IF NOT EXISTS notes TEXT;
    `);

    console.log('Migration successful: notes column added.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit();
  }
}

migrate();
