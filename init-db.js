import db from './config/db.js';

async function initDb() {
    try {
        console.log('Initializing database tables...');

        const createUsersTable = `
            CREATE TABLE IF NOT EXISTS users (
              id INT AUTO_INCREMENT PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              email VARCHAR(255) NOT NULL UNIQUE,
              password VARCHAR(255) NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;

        await db.query(createUsersTable);
        console.log('Users table created or already exists.');

        process.exit(0);
    } catch (error) {
        console.error('Error initializing DB:', error);
        process.exit(1);
    }
}

initDb();
