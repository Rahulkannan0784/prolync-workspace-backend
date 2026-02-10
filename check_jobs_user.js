
import pool from './config/db.js';

async function checkJobs() {
    const userId = 82;
    try {
        const [apps] = await pool.query("SELECT * FROM job_applications WHERE user_id = ?", [userId]);
        console.log("Job Applications:", JSON.stringify(apps, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkJobs();
