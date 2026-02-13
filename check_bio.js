import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'prolync_db'
};

async function checkBioColumn() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.query("SHOW COLUMNS FROM users LIKE 'bio'");
        console.log(rows);
    } catch (error) {
        console.error("Error:", error);
    } finally {
        if (connection) await connection.end();
    }
}

checkBioColumn();
