import db from './config/db.js';
import dotenv from 'dotenv';
dotenv.config();

const verify = async () => {
    try {
        const studentEmail = 'bavishikas@gmail.com';
        console.log("Checking for student:", studentEmail);

        const [users] = await db.query("SELECT id FROM users WHERE email = ?", [studentEmail]);
        if (!users.length) { console.log("User not found"); process.exit(); }
        const userId = users[0].id;

        console.log("Running Updated Query Logic...");

        const query = `SELECT ms.*, COALESCE(ms.meeting_link, m.meeting_url) as meeting_link,
                 STR_TO_DATE(ms.slot_time, '%Y-%m-%d %h:%i %p') as session_date
                 FROM mentorship_sessions ms
                 JOIN mentors m ON ms.mentor_id = m.id
                 WHERE ms.student_email = (SELECT email FROM users WHERE id = ?) 
                 AND (ms.status = 'Scheduled' OR ms.status = 'Pending') 
                 AND STR_TO_DATE(ms.slot_time, '%Y-%m-%d %h:%i %p') >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
                 ORDER BY session_date ASC 
                 LIMIT 1`;

        const [nextSess] = await db.query(query, [userId]);

        console.log(`\n--- Result Count: ${nextSess.length} ---`);
        if (nextSess.length > 0) {
            console.log("Row found:", nextSess[0]);
            console.log("Parsed Session Date:", nextSess[0].session_date);
        } else {
            console.log("No rows found with this query.");

            // Debugging: Check what STR_TO_DATE returns for ALL sessions
            console.log("\n--- Debugging STR_TO_DATE parsing ---");
            const [debugRows] = await db.query(`
                SELECT id, slot_time, STR_TO_DATE(slot_time, '%Y-%m-%d %h:%i %p') as parsed_date
                FROM mentorship_sessions
                WHERE student_email = ?
            `, [studentEmail]);
            console.table(debugRows);
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        process.exit();
    }
};

verify();
