import db from './config/db.js';
import dotenv from 'dotenv';
dotenv.config();

const checkSchema = async () => {
    try {
        console.log("Checking 'news' table schema...");
        const [rows] = await db.query("DESCRIBE news");
        console.log(rows);
        process.exit(0);
    } catch (error) {
        console.error("Error checking schema:", error);
        process.exit(1);
    }
};

checkSchema();
