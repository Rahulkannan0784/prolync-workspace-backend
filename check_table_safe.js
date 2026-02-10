
import pool from './config/db.js';
import fs from 'fs';

async function checkTable() {
    try {
        const [desc] = await pool.query("DESCRIBE student_video_progress");
        fs.writeFileSync('schema_output.json', JSON.stringify(desc, null, 2));
        console.log("Written to schema_output.json");
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkTable();
