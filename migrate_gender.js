import db from './config/db.js';

async function migrate() {
    try {
        console.log('Starting migration...');

        // Check if gender column exists
        const [columns] = await db.query('SHOW COLUMNS FROM users LIKE "gender"');

        if (columns.length === 0) {
            console.log('Adding gender column...');
            await db.query("ALTER TABLE users ADD COLUMN gender ENUM('Male', 'Female', 'Other') DEFAULT 'Male'");
            console.log('Column added successfully.');
        } else {
            console.log('Gender column already exists.');
        }

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        process.exit();
    }
}

migrate();
