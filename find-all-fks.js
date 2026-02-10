
import db from './config/db.js';

async function findAllFKs() {
    try {
        const query = `
            SELECT 
                TABLE_NAME, 
                CONSTRAINT_NAME
            FROM 
                INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE 
                REFERENCED_TABLE_NAME = 'users'
                AND REFERENCED_COLUMN_NAME = 'id'
                AND TABLE_SCHEMA = 'student_hub_db';
        `;
        const [rows] = await db.query(query);
        console.log('ALL FK References:', JSON.stringify(rows, null, 2));
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

findAllFKs();
