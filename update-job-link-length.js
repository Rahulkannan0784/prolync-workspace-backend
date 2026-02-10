import db from './config/db.js';

const updateSchema = async () => {
    try {
        console.log('Altering jobs table to support longer links...');
        await db.query(`ALTER TABLE jobs MODIFY COLUMN application_link TEXT`);
        console.log('✅ Success: application_link column changed to TEXT.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error updating schema:', err);
        process.exit(1);
    }
};

updateSchema();
