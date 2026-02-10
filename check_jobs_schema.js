
import db from './config/db.js';
import fs from 'fs';

const checkSchema = async () => {
    try {
        let output = '';

        output += '--- JOBS TABLE ---\n';
        const [jobsDesc] = await db.query('DESCRIBE jobs');
        output += JSON.stringify(jobsDesc, null, 2) + '\n';

        fs.writeFileSync('jobs_schema.txt', output);
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkSchema();
