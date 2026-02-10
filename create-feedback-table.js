import db from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const createFeedbackTable = async () => {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS feedback (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT, 
                user_name VARCHAR(255),
                rating INT,
                category VARCHAR(100),
                message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await db.query(query);
        console.log('Feedback table created successfully.');
        process.exit();
    } catch (error) {
        console.error('Error creating feedback table:', error);
        process.exit(1);
    }
};

createFeedbackTable();
