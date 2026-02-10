
import db from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const checkSchema = async () => {
    try {
        console.log('Checking projects table schema...');
        const [schema] = await db.query('DESCRIBE projects');
        console.table(schema);

        console.log('Checking project_applications table schema...');
        const [appSchema] = await db.query('DESCRIBE project_applications');
        console.table(appSchema);

        process.exit(0);
    } catch (err) {
        console.error('Error checking schema:', err);
        process.exit(1);
    }
};

checkSchema();
