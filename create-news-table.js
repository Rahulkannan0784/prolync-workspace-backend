import db from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const createNewsTable = async () => {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS news (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                category VARCHAR(100) NOT NULL,
                status VARCHAR(50) DEFAULT 'Draft',
                publish_date DATE,
                image_url VARCHAR(500),
                external_link VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await db.query(query);
        console.log('News table created successfully.');
        process.exit();
    } catch (error) {
        console.error('Error creating news table:', error);
        process.exit(1);
    }
};

createNewsTable();
