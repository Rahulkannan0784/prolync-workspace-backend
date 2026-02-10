
import db from './config/db.js';

async function check() {
    try {
        console.log("--- USERS DEPARTMENTS ---");
        const [users] = await db.query('SELECT DISTINCT department FROM users');
        console.log(users.map(u => u.department));

        console.log("\n--- HOD DEPARTMENTS ---");
        const [hods] = await db.query('SELECT DISTINCT department, college FROM hod');
        console.log(hods);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
