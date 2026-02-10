
import pool from './config/db.js';

async function checkTable() {
    try {
        const [desc] = await pool.query("DESCRIBE student_video_progress");
        console.log("SCHEMA:", JSON.stringify(desc, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkTable();
