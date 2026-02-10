import db from './config/db.js';
import dotenv from 'dotenv';
dotenv.config();

const migrate = async () => {
    try {
        console.log("Adding 'views' column to 'events' and 'placement_blogs' tables...");

        const tables = ['events', 'placement_blogs'];

        for (const table of tables) {
            try {
                await db.query(`ALTER TABLE ${table} ADD COLUMN views INT DEFAULT 0`);
                console.log(`Column 'views' added to '${table}' successfully.`);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`Column 'views' already exists in '${table}'.`);
                } else {
                    console.error(`Error altering table '${table}':`, err.message);
                }
            }
        }

        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
};

migrate();
