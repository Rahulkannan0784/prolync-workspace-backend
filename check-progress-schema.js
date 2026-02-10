
import db from './config/db.js';

async function checkSchema() {
    try {
        console.log("Checking student_video_progress table...");
        const [rows] = await db.query("SHOW TABLES LIKE 'student_video_progress'");
        if (rows.length === 0) {
            console.log("Table 'student_video_progress' DOES NOT EXIST.");
            // Create it
            const createQuery = `
            CREATE TABLE student_video_progress (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                course_id INT NOT NULL,
                lesson_id INT NOT NULL,
                watched_seconds INT DEFAULT 0,
                is_completed BOOLEAN DEFAULT FALSE,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_booking (user_id, lesson_id),
                KEY course_idx (course_id)
            ) ENGINE=InnoDB;
            `;
            await db.query(createQuery);
            console.log("Table created.");
        } else {
            console.log("Table exists.");
            const [cols] = await db.query("SHOW COLUMNS FROM student_video_progress");
            console.log("Columns:", cols.map(c => c.Field));
        }
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

checkSchema();
