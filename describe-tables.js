
import db from './config/db.js';

async function describeTable() {
    try {
        const [adminCols] = await db.query("DESCRIBE admin");
        console.log('Admin Table Columns:', adminCols);

        const [userCols] = await db.query("DESCRIBE users");
        console.log('Users Table Columns:', userCols);

        process.exit();
    } catch (error) {
        console.error('Error describing tables:', error.message);
        process.exit(1);
    }
}

describeTable();
