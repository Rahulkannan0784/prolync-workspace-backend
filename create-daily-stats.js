import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const createStatsTable = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        // 1. Create daily_stats table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS daily_stats (
                id INT AUTO_INCREMENT PRIMARY KEY,
                date DATE NOT NULL UNIQUE,
                new_users INT DEFAULT 0,
                active_users INT DEFAULT 0,
                total_activities INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('daily_stats table created successfully.');

        // 2. Populate with some dummy historical data if empty (for visualization)
        const [rows] = await connection.query('SELECT COUNT(*) as count FROM daily_stats');
        if (rows[0].count === 0) {
            console.log('Populating dummy data for the last 30 days...');
            const values = [];
            for (let i = 30; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];

                // Random data
                const newUsers = Math.floor(Math.random() * 20) + 5;
                const activeUsers = Math.floor(Math.random() * 50) + 20;
                const activities = Math.floor(Math.random() * 200) + 50;

                // We use simple string concatenation for bulk insert setup, but parameterized is better. 
                // For this script, loop insert is fine or parameterized single insert.
                await connection.query(
                    'INSERT IGNORE INTO daily_stats (date, new_users, active_users, total_activities) VALUES (?, ?, ?, ?)',
                    [dateStr, newUsers, activeUsers, activities]
                );
            }
            console.log('Dummy stats data inserted.');
        }

        await connection.end();
    } catch (error) {
        console.error('Error creating daily_stats table:', error);
    }
};

createStatsTable();
