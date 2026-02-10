
import pool from './config/db.js';
import fs from 'fs';

async function checkOtherTables() {
    try {
        const [enrollDesc] = await pool.query("DESCRIBE enrollments");
        fs.writeFileSync('enrollments_schema.json', JSON.stringify(enrollDesc, null, 2));

        const [progDesc] = await pool.query("DESCRIBE user_progress");
        fs.writeFileSync('user_progress_schema.json', JSON.stringify(progDesc, null, 2));

        console.log("Written to enrollments_schema.json and user_progress_schema.json");
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkOtherTables();
