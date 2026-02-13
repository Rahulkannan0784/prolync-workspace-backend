import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

async function checkLocationColumn() {
    let connection;
    try {
        console.log("Connecting to database...");
        connection = await mysql.createConnection(dbConfig);
        console.log("Connected.");

        const [rows] = await connection.query("SHOW COLUMNS FROM users LIKE 'location'");

        if (rows.length > 0) {
            console.log("✅ Column 'location' ALREADY EXISTS in 'users' table.");
            console.log(rows[0]);
        } else {
            console.log("❌ Column 'location' DOES NOT EXIST in 'users' table.");
        }

    } catch (error) {
        console.error("Error verifying schema:", error);
    } finally {
        if (connection) await connection.end();
    }
}

checkLocationColumn();
