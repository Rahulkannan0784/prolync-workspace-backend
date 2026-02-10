
import db from './config/db.js';

async function describeTable() {
    try {
        const [adminCols] = await db.query("DESCRIBE admin");
        console.log('ADMIN_COLS:', adminCols.map(c => c.Field).join(', '));
        process.exit();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

describeTable();
