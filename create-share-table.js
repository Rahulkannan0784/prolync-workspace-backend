
import db from './config/db.js';

async function createShareTable() {
    try {
        const query = `
      CREATE TABLE IF NOT EXISTS shared_progress (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        share_token VARCHAR(255) NOT NULL UNIQUE,
        share_config JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;

        await db.query(query);
        console.log("Table 'shared_progress' created successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Error creating table:", error);
        process.exit(1);
    }
}

createShareTable();
