
import db from './config/db.js';
import dotenv from 'dotenv';
dotenv.config();

async function debugProjects() {
    try {
        const [rows] = await db.query(`
            SELECT id, student_id, project_id, status, github_url, live_url, applied_at 
            FROM project_applications 
            ORDER BY applied_at DESC 
            LIMIT 5
        `);
        console.log("Latest Project Applications:");
        console.table(rows);
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

debugProjects();
