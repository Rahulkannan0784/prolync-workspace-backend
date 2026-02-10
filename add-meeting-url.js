
import db from './config/db.js';

async function migrate() {
    try {
        console.log("Adding meeting_url column to mentors table...");
        await db.query(`ALTER TABLE mentors ADD COLUMN meeting_url VARCHAR(255) DEFAULT NULL`);
        console.log("Success!");
        process.exit(0);
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log("Column already exists.");
            process.exit(0);
        }
        console.error("Error:", error);
        process.exit(1);
    }
}

migrate();
