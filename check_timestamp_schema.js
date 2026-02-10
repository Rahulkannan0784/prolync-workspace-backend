
import db from './config/db.js';
import fs from 'fs';

const checkSchema = async () => {
    try {
        let output = '';

        output += '--- USERS TABLE ---\n';
        const [usersDesc] = await db.query('DESCRIBE users');
        const relevantUsers = usersDesc.filter(c => ['last_login', 'created_at'].includes(c.Field));
        output += JSON.stringify(relevantUsers, null, 2) + '\n';

        output += '\n--- LEARNING_ACTIVITY TABLE ---\n';
        const [laDesc] = await db.query('DESCRIBE learning_activity');
        output += JSON.stringify(laDesc, null, 2);

        fs.writeFileSync('schema_info.txt', output);
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkSchema();
