
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'student_hub_db'
};

async function fixSchema() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log("Connected to DB. Checking columns...");

        // Get current columns
        const [rows] = await connection.query(`DESCRIBE mentorship_sessions`);
        const columns = rows.map(r => r.Field);
        console.log("Current columns:", columns);

        // check and add student_name
        if (!columns.includes('student_name')) {
            console.log("Adding student_name column...");
            await connection.query(`ALTER TABLE mentorship_sessions ADD COLUMN student_name VARCHAR(255) AFTER id`);
        }

        // check and add student_email
        if (!columns.includes('student_email')) {
            console.log("Adding student_email column...");
            await connection.query(`ALTER TABLE mentorship_sessions ADD COLUMN student_email VARCHAR(255) AFTER student_name`);
        }

        // check and add meeting_link
        // Note: Controller tries to insert 'meeting_link', but mentors table has 'meeting_url'. 
        // We should add 'meeting_link' to sessions table to match controller.
        if (!columns.includes('meeting_link')) {
            console.log("Adding meeting_link column...");
            await connection.query(`ALTER TABLE mentorship_sessions ADD COLUMN meeting_link VARCHAR(255) AFTER status`);
        } else {
            console.log("meeting_link column already exists.");
        }

        console.log("Schema update complete.");

    } catch (error) {
        console.error("Error updating schema:", error.message);
    } finally {
        if (connection) await connection.end();
    }
}

fixSchema();
