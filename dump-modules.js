
import db from './config/db.js';

async function dumpModules() {
    try {
        console.log("Dumping course_modules...");
        const [rows] = await db.query("SELECT * FROM course_modules");
        console.table(rows);
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

dumpModules();
