
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const createTable = async () => {
    let connection;
    try {
        console.log("Connecting to database...");
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'student_hub_db'
        });

        console.log("Connected. Creating `hod_student_mapping` table...");

        const query = `
            CREATE TABLE IF NOT EXISTS hod_student_mapping (
                id INT AUTO_INCREMENT PRIMARY KEY,
                hod_id INT NOT NULL,
                student_id INT NOT NULL,
                assigned_by INT, 
                assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_assignment (hod_id, student_id),
                FOREIGN KEY (hod_id) REFERENCES hod(id) ON DELETE CASCADE,
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `;

        await connection.query(query);
        console.log("Table `hod_student_mapping` created successfully.");

    } catch (error) {
        console.error("Error creating table:", error);
    } finally {
        if (connection) await connection.end();
    }
};

createTable();
