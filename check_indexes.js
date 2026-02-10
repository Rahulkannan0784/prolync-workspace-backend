
import pool from './config/db.js';
import fs from 'fs';

async function checkIndexes() {
    try {
        const [indexes] = await pool.query("SHOW INDEX FROM student_video_progress");
        fs.writeFileSync('indexes_output.json', JSON.stringify(indexes, null, 2));
        console.log("Written to indexes_output.json");
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkIndexes();
