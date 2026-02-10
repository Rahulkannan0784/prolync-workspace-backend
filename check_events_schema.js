import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

async function checkEventsSchema() {
    try {
        const [rows] = await pool.query("DESCRIBE events");
        console.log(rows);
        process.exit();
    } catch (error) {
        console.error("Error checking events schema:", error);
        process.exit(1);
    }
}

checkEventsSchema();
