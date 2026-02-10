import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const createProgressTables = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        // 1. user_progress table
        // Stores course-level progress
        const userProgressQuery = `
            CREATE TABLE IF NOT EXISTS user_progress (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                course_id INT NOT NULL,
                completed_modules INT DEFAULT 0,
                total_modules INT DEFAULT 0,
                completion_percent INT DEFAULT 0,
                status ENUM('Not Started', 'In Progress', 'Completed') DEFAULT 'Not Started',
                last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_course (user_id, course_id)
            )
        `;
        await connection.query(userProgressQuery);
        console.log('user_progress table created successfully.');

        // 2. learning_activity table
        // Stores daily activity for streak & time
        const learningActivityQuery = `
            CREATE TABLE IF NOT EXISTS learning_activity (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                course_id INT,
                video_id INT,
                time_spent_seconds INT DEFAULT 0,
                activity_date DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
            )
        `;
        await connection.query(learningActivityQuery);
        console.log('learning_activity table created successfully.');

        // 3. certificates table
        // Stores issued certificates
        const certificatesQuery = `
            CREATE TABLE IF NOT EXISTS certificates (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                course_id INT NOT NULL,
                certificate_code VARCHAR(50) UNIQUE NOT NULL,
                issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
            )
        `;
        await connection.query(certificatesQuery);
        console.log('certificates table created successfully.');

        await connection.end();
    } catch (error) {
        console.error('Error creating progress tables:', error);
    }
};

createProgressTables();
