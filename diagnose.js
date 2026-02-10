import db from './config/db.js';

async function check() {
    try {
        const [rows] = await db.query('SELECT status, is_active, COUNT(*) as count FROM questions GROUP BY status, is_active');
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}
check();
