
import db from './config/db.js';

const addDeptColumn = async () => {
    try {
        console.log('Checking for department column...');
        const [columns] = await db.query("SHOW COLUMNS FROM users LIKE 'department'");

        if (columns.length === 0) {
            console.log('Adding department column...');
            await db.query("ALTER TABLE users ADD COLUMN department VARCHAR(100) DEFAULT NULL AFTER college_name");
            console.log('Department column added successfully.');
        } else {
            console.log('Department column already exists.');
        }
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

addDeptColumn();
