import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const createPlacementsTable = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        const query = `
            CREATE TABLE IF NOT EXISTS placements (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                company VARCHAR(255) NOT NULL,
                role VARCHAR(255),
                package VARCHAR(100),
                batch VARCHAR(50),
                type ENUM('Placement', 'Internship', 'Success Story') DEFAULT 'Success Story',
                image_url VARCHAR(500),
                video_url VARCHAR(500),
                description TEXT,
                tips TEXT,
                interview_experience TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `;

        await connection.query(query);
        console.log('Placements table created successfully.');
        await connection.end();
    } catch (error) {
        console.error('Error creating placements table:', error);
    }
};

createPlacementsTable();
