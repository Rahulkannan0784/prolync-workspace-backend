import db from './config/db.js';

async function createMentorshipTable() {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS mentorship_sessions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_name VARCHAR(255) NOT NULL,
                student_email VARCHAR(255) NOT NULL,
                mentor_id INT NOT NULL,
                mentor_name VARCHAR(255) NOT NULL,
                slot_time VARCHAR(255) NOT NULL,
                topic TEXT,
                status VARCHAR(50) DEFAULT 'Upcoming',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await db.query(query);
        console.log("Mentorship sessions table created successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Error creating table:", error);
        process.exit(1);
    }
}

createMentorshipTable();
