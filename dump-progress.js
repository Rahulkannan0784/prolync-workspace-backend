
import db from './config/db.js';

async function dumpProgress() {
    try {
        console.log("Dumping student_video_progress...");
        const [rows] = await db.query("SELECT * FROM student_video_progress");
        console.table(rows);
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

dumpProgress();
