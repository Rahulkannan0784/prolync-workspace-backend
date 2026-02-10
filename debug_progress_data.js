
import pool from './config/db.js';

async function checkSchema() {
    try {
        const [enrollments] = await pool.query("SELECT * FROM enrollments LIMIT 10");
        console.log("ENROLLMENTS:", JSON.stringify(enrollments, null, 2));

        const [userProgress] = await pool.query("SELECT * FROM user_progress LIMIT 10");
        console.log("USER_PROGRESS:", JSON.stringify(userProgress, null, 2));

        const [videoProgress] = await pool.query("SELECT * FROM student_video_progress LIMIT 10");
        console.log("VIDEO_PROGRESS:", JSON.stringify(videoProgress, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkSchema();
