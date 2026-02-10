import db from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const createTable = async () => {
    try {
        console.log('Creating feature_flags table...');
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS feature_flags (
                id INT AUTO_INCREMENT PRIMARY KEY,
                feature_key VARCHAR(50) UNIQUE NOT NULL,
                feature_name VARCHAR(255) NOT NULL,
                is_enabled BOOLEAN DEFAULT FALSE,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `;

        await db.query(createTableQuery);
        console.log('feature_flags table created/verified.');
        process.exit(0);
    } catch (err) {
        console.error('Error creating feature_flags table:', err);
        process.exit(1);
    }
};

createTable();
