import db from './config/db.js';

async function addCurrentRoleColumn() {
    try {
        console.log('Adding current_role column to users table...');

        // Try adding the column directly. If it fails with duplicate, we ignore.
        await db.query(`
      ALTER TABLE users
      ADD COLUMN current_role VARCHAR(100) DEFAULT 'Student'
    `);

        console.log('current_role column added successfully.');
        process.exit(0);
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('Column already exists, skipping.');
            process.exit(0);
        }
        console.error('Error adding column:', error);
        process.exit(1);
    }
}

addCurrentRoleColumn();
