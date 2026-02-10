
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const createCodingProgressTables = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        // user_badges table
        const userBadgesQuery = `
            CREATE TABLE IF NOT EXISTS user_badges (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                badge_type ENUM('problem_solver', 'streak_master', 'kit_completer', 'scenario_conqueror', 'early_bird') NOT NULL,
                badge_name VARCHAR(255) NOT NULL,
                earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_badge (user_id, badge_type, badge_name)
            )
        `;
        await connection.query(userBadgesQuery);
        console.log('user_badges table created successfully.');

        await connection.end();
    } catch (error) {
        console.error('Error creating coding progress tables:', error);
    }
};

createCodingProgressTables();
