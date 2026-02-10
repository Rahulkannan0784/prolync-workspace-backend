
import db from './config/db.js';

async function addShareDataColumn() {
    try {
        const checkQuery = `
            SELECT COUNT(*) AS count 
            FROM information_schema.columns 
            WHERE table_name = 'shared_progress' 
            AND column_name = 'share_data' 
            AND table_schema = DATABASE()
        `;

        const [rows] = await db.query(checkQuery);

        if (rows[0].count === 0) {
            const alterQuery = `ALTER TABLE shared_progress ADD COLUMN share_data JSON`;
            await db.query(alterQuery);
            console.log("Column 'share_data' added successfully to 'shared_progress' table.");
        } else {
            console.log("Column 'share_data' already exists.");
        }
        process.exit(0);
    } catch (error) {
        console.error("Error adding column:", error);
        process.exit(1);
    }
}

addShareDataColumn();
