import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

async function check() {
    try {
        const [eventCols] = await pool.query("SHOW COLUMNS FROM events WHERE Field IN ('image_source', 'preparation_tips')");
        console.log("Events Columns Found:");
        eventCols.forEach(c => console.log(`- ${c.Field}: ${c.Type}`));

        const [certCols] = await pool.query("SHOW COLUMNS FROM certificates WHERE Field = 'certificate_code'");
        console.log("\nCertificates Columns Found:");
        certCols.forEach(c => console.log(`- ${c.Field}: ${c.Type}`));

        const [eventData] = await pool.query("SELECT id, image_source FROM events ORDER BY id DESC LIMIT 3");
        console.log("\nRecent Events Data:");
        eventData.forEach(e => console.log(`- ID ${e.id}: src=${e.image_source}`));

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
