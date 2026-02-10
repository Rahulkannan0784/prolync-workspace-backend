
import db from './config/db.js';

async function checkUserCols() {
    try {
        const [cols] = await db.query("DESCRIBE users");
        const fields = cols.map(c => c.Field);
        console.log('UserFields:', fields);
        console.log('Has pass:', fields.includes('password'));
        process.exit();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkUserCols();
