import db from './config/db.js';

const recreateMentorsTable = async () => {
    try {
        console.log("Dropping dependent tables...");
        await db.query('DROP TABLE IF EXISTS mentor_slots');
        await db.query('DROP TABLE IF EXISTS mentorship_sessions'); // Just in case

        console.log("Dropping mentors table...");
        await db.query('DROP TABLE IF EXISTS mentors');

        console.log("Creating mentors table...");
        const query = `
            CREATE TABLE mentors (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                role VARCHAR(255) NOT NULL,
                company VARCHAR(255),
                bio TEXT,
                image_url VARCHAR(500),
                skills TEXT, -- JSON Array
                focus TEXT, -- JSON Array
                is_certified BOOLEAN DEFAULT FALSE,
                is_verified BOOLEAN DEFAULT FALSE,
                is_top_rated BOOLEAN DEFAULT FALSE,
                session_type VARCHAR(255), -- Group, One-on-One
                availability TEXT, -- JSON Array
                max_participants INT DEFAULT 1,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `;
        await db.query(query);
        console.log("Mentors table recreated successfully.");
        process.exit();
    } catch (error) {
        console.error("Error recreating mentors table:", error);
        process.exit(1);
    }
};

recreateMentorsTable();
