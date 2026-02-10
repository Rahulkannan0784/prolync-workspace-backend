import db from './config/db.js';

async function test() {
    try {
        const [rows] = await db.query('SELECT 1');
        console.log('DB Connection Success:', rows);
        process.exit(0);
    } catch (e) {
        console.error('DB Connection Failed:', e);
        process.exit(1);
    }
}

test();
