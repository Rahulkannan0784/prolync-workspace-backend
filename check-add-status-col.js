import db from './config/db.js';
import 'dotenv/config';

async function checkAndAddStatus() {
    try {
        const [columns] = await db.query('DESCRIBE users');
        const hasStatus = columns.some(col => col.Field === 'status');

        console.log('Columns:', columns.map(c => c.Field));

        if (!hasStatus) {
            console.log('Adding status column...');
            await db.query("ALTER TABLE users ADD COLUMN status ENUM('Active', 'Inactive', 'Banned') DEFAULT 'Active'");
            console.log('Status column added.');
        } else {
            console.log('Status column already exists.');
        }
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkAndAddStatus();
