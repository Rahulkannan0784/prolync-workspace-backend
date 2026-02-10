
import db from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const checkStreak = async () => {
    try {
        console.log('Fetching learning_streak table...');
        const [rows] = await db.query(`
            SELECT *, 
            CURDATE() as server_date,
            DATEDIFF(CURDATE(), last_active_date) as diff 
            FROM learning_streak
        `);
        console.log(rows);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
};

checkStreak();
