import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const createExtrasTable = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        // 1. Modules Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS modules (
                id INT AUTO_INCREMENT PRIMARY KEY,
                course_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                order_index INT DEFAULT 0,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
            )
        `);
        console.log('Modules table created.');

        // 2. Lessons Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS lessons (
                id INT AUTO_INCREMENT PRIMARY KEY,
                module_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                content_url TEXT,
                duration INT DEFAULT 0, -- in minutes
                order_index INT DEFAULT 0,
                FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
            )
        `);
        console.log('Lessons table created.');

        // 3. Certificates Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS certificates (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                course_id INT NOT NULL,
                certificate_code VARCHAR(50) UNIQUE NOT NULL,
                issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
            )
        `);
        console.log('Certificates table created.');

        // 4. Course Ratings Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS course_ratings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                course_id INT NOT NULL,
                rating INT CHECK (rating >= 1 AND rating <= 5),
                review TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
            )
        `);
        console.log('Course Ratings table created.');

        // 5. Seed Mock Ratings (Optional, if empty)
        const [ratings] = await connection.query('SELECT COUNT(*) as count FROM course_ratings');
        if (ratings[0].count === 0) {
            // Insert some dummy ratings for existing courses if any
            // We'll skip complex seeding for now, relies on main seed script or manual entry
        }

        await connection.end();
        console.log('All extra course tables setup complete.');
    } catch (error) {
        console.error('Error creating extra tables:', error);
    }
};

createExtrasTable();
