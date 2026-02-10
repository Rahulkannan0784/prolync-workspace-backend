import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

async function updateEventsSchema() {
    try {
        console.log("Updating events table schema...");

        // 1. Add status column
        try {
            await pool.query("ALTER TABLE events ADD COLUMN status ENUM('Draft', 'Published') DEFAULT 'Draft'");
            console.log("Added status column");
        } catch (e) {
            if (!e.message.includes("Duplicate column")) console.log("Error adding status column:", e.message);
            else console.log("status column already exists");
        }

        // 2. Add preparation_tips column
        try {
            await pool.query("ALTER TABLE events ADD COLUMN preparation_tips JSON NULL");
            console.log("Added preparation_tips column");
        } catch (e) {
            if (!e.message.includes("Duplicate column")) console.log("Error adding preparation_tips column:", e.message);
            else console.log("preparation_tips column already exists");
        }

        console.log("Schema update complete.");
        process.exit();
    } catch (error) {
        console.error("Schema update failed:", error);
        process.exit(1);
    }
}

updateEventsSchema();
