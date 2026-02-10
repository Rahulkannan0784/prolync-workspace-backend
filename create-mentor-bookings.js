import db from './config/db.js';

async function createMentorBookingsTable() {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS mentor_bookings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_name VARCHAR(100) NOT NULL,
                email VARCHAR(150) NOT NULL,
                mentor_name VARCHAR(100) NOT NULL,
                slot_time VARCHAR(50) NOT NULL,
                topic VARCHAR(255),
                status ENUM('Pending', 'Confirmed', 'Cancelled') DEFAULT 'Pending',
                booking_date DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await db.query(query);
        console.log("mentor_bookings table created successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Error creating table:", error);
        process.exit(1);
    }
}

createMentorBookingsTable();
