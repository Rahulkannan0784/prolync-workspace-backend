import db from './config/db.js';

const updateJobTable = async () => {
    try {
        try {
            await db.query(`ALTER TABLE jobs ADD responsibilities TEXT AFTER job_description`);
            console.log('Added responsibilities column');
        } catch (e) {
            console.log('Responsibilities column might already exist');
        }

        try {
            await db.query(`ALTER TABLE jobs ADD eligibility TEXT AFTER responsibilities`);
            console.log('Added eligibility column');
        } catch (e) {
            console.log('Eligibility column might already exist');
        }

        process.exit();
    } catch (err) {
        console.error('Error updating jobs table:', err);
        process.exit(1);
    }
};

updateJobTable();
