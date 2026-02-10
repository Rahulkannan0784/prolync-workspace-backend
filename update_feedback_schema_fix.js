import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

async function updateSchema() {
    try {
        console.log("Updating feedback table schema...");

        // 1. Add user_id if missing
        try {
            await pool.query("ALTER TABLE feedback ADD COLUMN user_id INT NULL");
            console.log("Added user_id column");
        } catch (e) {
            if (!e.message.includes("Duplicate column")) console.log("user_id exists or error:", e.message);
        }

        // 2. Add detailed ratings
        const newCols = [
            "rating_course INT DEFAULT 0",
            "rating_ui INT DEFAULT 0",
            "rating_ux INT DEFAULT 0",
            "rating_coding INT DEFAULT 0",
            "rating_general INT DEFAULT 0"
        ];

        for (const col of newCols) {
            try {
                await pool.query(`ALTER TABLE feedback ADD COLUMN ${col}`);
                console.log(`Added ${col.split(' ')[0]}`);
            } catch (e) {
                // Ignore duplicate
            }
        }

        // 3. Make email nullable if we rely on user_id, or ensure we fill it
        // We will keep email as is, but logic will fill it.

        console.log("Schema update complete.");
        process.exit();
    } catch (error) {
        console.error("Schema update failed:", error);
        process.exit(1);
    }
}

updateSchema();
