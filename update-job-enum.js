import db from './config/db.js';

const updateEnum = async () => {
    try {
        console.log('Altering job_type ENUM to include "Walk-in"...');
        // Note: We must list ALL existing values plus the new one.
        await db.query(`
            ALTER TABLE jobs 
            MODIFY COLUMN job_type ENUM('Internship', 'Full-time', 'Part-time', 'Contract', 'Walk-in') NOT NULL
        `);
        console.log('✅ Success: job_type ENUM updated.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error updating enum:', err);
        process.exit(1);
    }
};

updateEnum();
