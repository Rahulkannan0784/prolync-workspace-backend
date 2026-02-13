// Migration script to add show_location column
import db from './config/db.js';

async function runMigration() {
    try {
        console.log('Running migration: Adding show_location column...');

        const sql = `ALTER TABLE users ADD COLUMN show_location BOOLEAN DEFAULT TRUE AFTER show_phone`;

        await db.query(sql);

        console.log('✅ Migration completed successfully!');
        console.log('Added show_location column to users table');

        process.exit(0);
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('⚠️  Column show_location already exists, skipping...');
            process.exit(0);
        } else {
            console.error('❌ Migration failed:', error.message);
            process.exit(1);
        }
    }
}

runMigration();
