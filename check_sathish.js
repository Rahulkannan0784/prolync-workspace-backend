
import pool from './config/db.js';

async function checkSathish() {
    try {
        const [users] = await pool.query("SELECT id, name, email FROM users WHERE name LIKE '%SATHISH%'");
        console.log("USERS:", JSON.stringify(users, null, 2));

        if (users.length > 0) {
            const userId = users[0].id;
            const [enrollments] = await pool.query("SELECT * FROM enrollments WHERE user_id = ?", [userId]);
            console.log("ENROLLMENTS:", JSON.stringify(enrollments, null, 2));

            const [userProgress] = await pool.query("SELECT * FROM user_progress WHERE user_id = ?", [userId]);
            console.log("USER_PROGRESS:", JSON.stringify(userProgress, null, 2));

            const [videoProgress] = await pool.query("SELECT * FROM student_video_progress WHERE user_id = ?", [userId]);
            console.log("VIDEO_PROGRESS:", JSON.stringify(videoProgress, null, 2));
        }

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkSathish();
