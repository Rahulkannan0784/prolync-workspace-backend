
import db from './config/db.js';

async function checkColumns() {
    try {
        const [rows] = await db.query("SHOW COLUMNS FROM mentors");
        console.log("Columns in 'mentors' table:");
        rows.forEach(row => console.log(row.Field));
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

checkColumns();
