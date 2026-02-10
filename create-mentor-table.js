import db from './config/db.js';

const createMentorsTable = async () => {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS mentors (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                role VARCHAR(255) NOT NULL,
                company VARCHAR(255),
                bio TEXT,
                image_url VARCHAR(500),
                skills TEXT, -- Comma separated or JSON
                focus TEXT, -- Comma separated or JSON
                is_certified BOOLEAN DEFAULT FALSE,
                is_verified BOOLEAN DEFAULT FALSE,
                is_top_rated BOOLEAN DEFAULT FALSE,
                session_type VARCHAR(255), -- Group, One-on-One
                availability TEXT, -- JSON or Comma separated
                max_participants INT DEFAULT 1,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `;
        await db.query(query);
        console.log("Mentors table created successfully.");
        process.exit();
    } catch (error) {
        console.error("Error creating mentors table:", error);
        process.exit(1);
    }
};

createMentorsTable();
