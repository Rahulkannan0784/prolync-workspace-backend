
import db from './config/db.js';

async function checkFKs() {
    try {
        const query = `
            SELECT 
                TABLE_NAME, 
                COLUMN_NAME, 
                CONSTRAINT_NAME, 
                REFERENCED_TABLE_NAME, 
                REFERENCED_COLUMN_NAME
            FROM 
                INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE 
                REFERENCED_TABLE_SCHEMA = 'student_hub_db' 
                AND REFERENCED_TABLE_NAME = 'users'
                AND REFERENCED_COLUMN_NAME = 'id';
        `;
        const [rows] = await db.query(query);
        console.log('FK References:', JSON.stringify(rows, null, 2));
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkFKs();
