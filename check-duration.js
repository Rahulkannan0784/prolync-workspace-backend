
import db from './config/db.js';

async function checkDuration() {
    try {
        const [rows] = await db.query('SELECT id, course_id, title, duration_seconds FROM course_modules');
        console.table(rows);
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkDuration();
