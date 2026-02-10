
import db from './config/db.js';

const createHodTable = async () => {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS hod (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                college VARCHAR(255) NOT NULL,
                department VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await db.query(query);
        console.log("HOD table created successfully.");
        process.exit();
    } catch (error) {
        console.error("Error creating HOD table:", error);
        process.exit(1);
    }
};

createHodTable();
