
import db from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const createStreakTable = async () => {
    try {
        console.log('Creating learning_streak table...');

        await db.query(`
            CREATE TABLE IF NOT EXISTS learning_streak (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL UNIQUE,
                current_streak INT DEFAULT 0,
                last_active_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        console.log('learning_streak table created successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error creating learning_streak table:', error);
        process.exit(1);
    }
};

createStreakTable();
