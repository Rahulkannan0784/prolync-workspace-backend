import db from './config/db.js';
import dotenv from 'dotenv';
dotenv.config();

const migrate = async () => {
    try {
        console.log("Adding 'views' column to 'jobs' table...");

        // Add column if not exists
        try {
            await db.query(`ALTER TABLE jobs ADD COLUMN views INT DEFAULT 0`);
            console.log("Column 'views' added successfully.");
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log("Column 'views' already exists.");
            } else {
                throw err;
            }
        }

        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
};

migrate();
