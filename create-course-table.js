import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const createCourseTable = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        const query = `
            CREATE TABLE IF NOT EXISTS courses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                instructor VARCHAR(100),
                thumbnail VARCHAR(255),
                category VARCHAR(50),
                level ENUM('Beginner', 'Intermediate', 'Advanced') DEFAULT 'Beginner',
                price DECIMAL(10, 2) DEFAULT 0.00,
                status ENUM('Draft', 'Published', 'Archived') DEFAULT 'Draft',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `;

        await connection.query(query);
        console.log('Courses table created successfully.');
        await connection.end();
    } catch (error) {
        console.error('Error creating courses table:', error);
    }
};

createCourseTable();
