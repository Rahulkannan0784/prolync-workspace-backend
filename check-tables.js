
import db from './config/db.js';

async function checkTables() {
    try {
        const [rows] = await db.query("SHOW TABLES LIKE 'admin'");
        console.log('Admin table check:', rows);
        if (rows.length === 0) {
            console.log('MISSING: admin table');
        } else {
            console.log('FOUND: admin table');
        }
        process.exit();
    } catch (error) {
        console.error('Error checking tables:', error.message);
        process.exit(1);
    }
}

checkTables();
