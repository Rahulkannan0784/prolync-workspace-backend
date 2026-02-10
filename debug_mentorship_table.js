
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'student_hub_db'
};

async function checkSchema() {
    let connection;
    try {
        console.log("Connecting to DB:", dbConfig.database);
        connection = await mysql.createConnection(dbConfig);

        console.log("--- Checking mentorship_sessions table ---");
        try {
            const [rows] = await connection.query(`DESCRIBE mentorship_sessions`);
            console.table(rows);
        } catch (e) {
            console.log("Error describing mentorship_sessions:", e.message);
        }

        console.log("--- Checking mentors table ---");
        try {
            const [mentorRows] = await connection.query(`DESCRIBE mentors`);
            console.table(mentorRows);
        } catch (e) {
            console.log("Error describing mentors:", e.message);
        }

    } catch (error) {
        console.error("Database Connection Error:", error.message);
    } finally {
        if (connection) await connection.end();
    }
}

checkSchema();
