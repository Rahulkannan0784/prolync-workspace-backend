
import db from './config/db.js';

async function describeTable() {
    try {
        const [rows] = await db.query("DESCRIBE users");
        console.log('Schema:', JSON.stringify(rows, null, 2));

        // Check for nulls or duplicates in custom_id
        const [audit] = await db.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(custom_id) as non_null_custom_ids,
                COUNT(DISTINCT custom_id) as unique_custom_ids
            FROM users
        `);
        console.log('Data Audit:', JSON.stringify(audit, null, 2));
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

describeTable();
