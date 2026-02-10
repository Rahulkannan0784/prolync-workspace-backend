import db from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const updateFeedbackSchema = async () => {
    try {
        const queries = [
            "ALTER TABLE feedback ADD COLUMN rating_course INT DEFAULT 0",
            "ALTER TABLE feedback ADD COLUMN rating_ui INT DEFAULT 0",
            "ALTER TABLE feedback ADD COLUMN rating_ux INT DEFAULT 0",
            "ALTER TABLE feedback ADD COLUMN rating_coding INT DEFAULT 0",
            "ALTER TABLE feedback ADD COLUMN comments TEXT"
        ];

        for (const query of queries) {
            try {
                await db.query(query);
                console.log(`Executed: ${query}`);
            } catch (err) {
                // Ignore if column already exists
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`Column already exists, skipping: ${query}`);
                } else {
                    console.error(`Error executing ${query}:`, err.message);
                }
            }
        }

        console.log('Feedback table schema updated successfully.');
        process.exit();
    } catch (error) {
        console.error('Error updating feedback schema:', error);
        process.exit(1);
    }
};

updateFeedbackSchema();
