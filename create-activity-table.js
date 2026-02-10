import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const createActivityTable = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        const query = `
            CREATE TABLE IF NOT EXISTS activity_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                action VARCHAR(50) NOT NULL,
                details TEXT,
                ip_address VARCHAR(45),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `;

        await connection.query(query);
        console.log('Activity Logs table created successfully.');
        await connection.end();
    } catch (error) {
        console.error('Error creating activity_logs table:', error);
    }
};

createActivityTable();
