import db from './config/db.js';
import dotenv from 'dotenv';
dotenv.config();

async function checkContextTypes() {
    try {
        const [rows] = await db.query("SELECT DISTINCT context_type, COUNT(*) as count FROM submissions GROUP BY context_type");
        console.log("Context Types in DB:", rows);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkContextTypes();
