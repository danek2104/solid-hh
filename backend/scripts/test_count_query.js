require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../db');

async function testQuery() {
  try {
    // 1. Create a dummy user (employer)
    const random = Math.floor(Math.random() * 10000);
    const empRes = await db.query(`INSERT INTO users (first_name, email, password_hash, role) VALUES ('Emp', 'emp${random}@test.com', 'hash', 'employer') RETURNING id`);
    const empId = empRes.rows[0].id;

    // 2. Create a dummy job
    const jobRes = await db.query("INSERT INTO jobs (title, employer_id, salary_min) VALUES ('Test Job', $1, 100) RETURNING id", [empId]);
    const jobId = jobRes.rows[0].id;

    // 3. Create a dummy seeker
    const seekRes = await db.query(`INSERT INTO users (first_name, email, password_hash, role) VALUES ('Seeker', 'seek${random}@test.com', 'hash', 'seeker') RETURNING id`);
    const seekId = seekRes.rows[0].id;

    // 4. Apply
    // await db.query("INSERT INTO applications (job_id, user_id) VALUES ($1, $2)", [jobId, seekId]);

    // 5. Run the problematic query
    const res = await db.query(
      `SELECT j.*, COUNT(a.id)::int as application_count 
       FROM jobs j 
       LEFT JOIN applications a ON j.id = a.job_id 
       WHERE j.employer_id = $1 
       GROUP BY j.id 
       ORDER BY j.created_at DESC`,
      [empId]
    );

    console.log("Result:", res.rows);
    console.log("Type of application_count:", typeof res.rows[0].application_count);
    console.log("Value of application_count:", res.rows[0].application_count);

    // Cleanup
    await db.query("DELETE FROM applications WHERE job_id = $1", [jobId]);
    await db.query("DELETE FROM jobs WHERE id = $1", [jobId]);
    await db.query("DELETE FROM users WHERE id = $1", [empId]);
    await db.query("DELETE FROM users WHERE id = $1", [seekId]);

  } catch (err) {
    console.error(err);
  } finally {
      process.exit();
  }
}

testQuery();
