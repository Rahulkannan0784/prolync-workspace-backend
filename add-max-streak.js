
import db from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const addMaxStreak = async () => {
    try {
        console.log('Adding max_streak column to learning_streak table...');
        await db.query(`
            ALTER TABLE learning_streak 
            ADD COLUMN IF NOT EXISTS max_streak INT DEFAULT 0
        `);
        console.log('Column added successfully (or already exists).');
    } catch (error) {
        // Ignore "Duplicate column name" error if IF NOT EXISTS doesn't catch it (MySQL 5.7+ supports it usually)
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('Column already exists.');
        } else {
            console.error('Error adding column:', error);
        }
    } finally {
        process.exit();
    }
};

addMaxStreak();
