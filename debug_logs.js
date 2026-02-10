
import mysql from 'mysql2/promise';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

async function checkLogs() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT id, user_id, action, details, created_at FROM activity_logs ORDER BY created_at DESC LIMIT 10');
        fs.writeFileSync('logs_output.json', JSON.stringify(rows, null, 2));
        console.log("Written to logs_output.json");
        await connection.end();
    } catch (e) {
        console.error("Error:", e);
    }
}

checkLogs();
