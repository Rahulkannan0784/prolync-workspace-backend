import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const createEnrollmentTable = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        const query = `
            CREATE TABLE IF NOT EXISTS enrollments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                course_id INT NOT NULL,
                progress INT DEFAULT 0,
                completed BOOLEAN DEFAULT FALSE,
                enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
            )
        `;

        await connection.query(query);
        console.log('Enrollments table created successfully.');
        await connection.end();
    } catch (error) {
        console.error('Error creating enrollments table:', error);
    }
};

createEnrollmentTable();
