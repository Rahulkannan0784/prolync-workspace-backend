
import db from './config/db.js';

async function check() {
    try {
        const [rows] = await db.query("SHOW TABLES");
        console.log("Tables found in database:");
        const tables = rows.map(r => Object.values(r)[0]);
        tables.forEach(t => console.log(` - ${t}`));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
