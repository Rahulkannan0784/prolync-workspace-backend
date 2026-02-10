import db from './config/db.js';

async function setupTables() {
    try {
        console.log("Setting up missing tables...");

        // 1. user_courses
        await db.query(`
            CREATE TABLE IF NOT EXISTS user_courses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                course_id INT NOT NULL,
                status VARCHAR(50) DEFAULT 'enrolled',
                progress INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_enrollment (user_id, course_id)
            )
        `);
        console.log("user_courses table checked/created.");

        // 2. user_badges
        await db.query(`
            CREATE TABLE IF NOT EXISTS user_badges (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                badge_name VARCHAR(100) NOT NULL,
                description TEXT,
                icon_url VARCHAR(255),
                earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("user_badges table checked/created.");

        // 3. certificates
        await db.query(`
            CREATE TABLE IF NOT EXISTS certificates (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                course_id INT NOT NULL,
                certificate_code VARCHAR(100) UNIQUE,
                certificate_url VARCHAR(500),
                issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("certificates table checked/created.");

        process.exit(0);
    } catch (err) {
        console.error("Table Setup Failed:", err);
        process.exit(1);
    }
}

setupTables();
