
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'student_hub_db'
};

async function checkJobs() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log("Connected to DB:", dbConfig.database);

        const [rows] = await connection.query(`SELECT COUNT(*) as count FROM jobs`);
        console.log("Job Count:", rows[0].count);

        if (rows[0].count > 0) {
            const [jobs] = await connection.query(`SELECT * FROM jobs LIMIT 1`);
            console.log("Sample Job:", jobs[0]);
        }

    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        if (connection) await connection.end();
    }
}

checkJobs();
