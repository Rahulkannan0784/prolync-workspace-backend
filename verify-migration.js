
import db from './config/db.js';

async function verifyMigration() {
    try {
        const [rows] = await db.query("DESCRIBE users");
        console.log('Final Schema:', JSON.stringify(rows, null, 2));
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

verifyMigration();
