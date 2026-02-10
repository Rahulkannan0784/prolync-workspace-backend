import db from './config/db.js';

async function updateSchema() {
    try {
        console.log('Running schema update for Unified Profile System...');

        const columnsToAdd = [
            'ADD COLUMN bio TEXT',
            'ADD COLUMN location VARCHAR(255)',
            'ADD COLUMN github VARCHAR(255)',
            'ADD COLUMN linkedin VARCHAR(255)'
        ];

        for (const col of columnsToAdd) {
            try {
                await db.query(`ALTER TABLE users ${col}`);
                console.log(`Success: ${col}`);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`Skipped (already exists): ${col}`);
                } else {
                    console.error(`Error adding column: ${col}`, err.message);
                }
            }
        }

        console.log('Schema update completed.');
        process.exit();
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

updateSchema();
