const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function setupDatabase() {
  const dbConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  };

  const dbName = process.env.DB_NAME;

  // 1. Connect to 'postgres' default DB to check/create our DB
  const client = new Client({ ...dbConfig, database: 'postgres' });
  
  try {
    await client.connect();
    console.log('Connected to postgres...');

    const checkDb = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);
    if (checkDb.rows.length === 0) {
      console.log(`Database ${dbName} not found. Creating...`);
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database ${dbName} created successfully.`);
    } else {
      console.log(`Database ${dbName} already exists.`);
    }
    await client.end();

    // 2. Connect to the target DB and apply schema
    const targetDbClient = new Client({ ...dbConfig, database: dbName });
    await targetDbClient.connect();
    console.log(`Connected to ${dbName}...`);

    const schemaPath = path.join(__dirname, '../schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Applying schema...');
    await targetDbClient.query(schemaSql);
    console.log('Schema applied successfully.');

    // 3. Seed some initial data if empty
    const checkJobs = await targetDbClient.query('SELECT count(*) FROM jobs');
    if (parseInt(checkJobs.rows[0].count) === 0) {
        console.log('Seeding initial data...');
        // Create a test employer user
        const userRes = await targetDbClient.query(`
            INSERT INTO users (first_name, last_name, email, password_hash, phone, role)
            VALUES ('Test', 'Employer', 'employer@example.com', 'hash', '+79990000000', 'employer')
            RETURNING id
        `);
        const userId = userRes.rows[0].id;

        // Create sample jobs
        await targetDbClient.query(`
            INSERT INTO jobs (title, description, salary_min, salary_max, location, employer_id)
            VALUES 
            ('Construction Worker', 'General labor for construction site.', 50000, 70000, 'Moscow', $1),
            ('Cleaner', 'Office cleaning services.', 40000, 50000, 'Saint Petersburg', $1),
            ('Delivery Driver', 'Food delivery driver.', 60000, 90000, 'Kazan', $1)
        `, [userId]);
        console.log('Seed data inserted.');
    }

    await targetDbClient.end();
    console.log('Database setup complete!');

  } catch (err) {
    console.error('Error setting up database:', err);
    process.exit(1);
  }
}

setupDatabase();
