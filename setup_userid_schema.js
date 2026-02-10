import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};

async function migrate() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to', dbConfig.database);

        // 1. Create id_sequences table
        console.log('Creating id_sequences table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS id_sequences (
                year INT PRIMARY KEY,
                last_letter_sequence CHAR(2) NOT NULL DEFAULT 'aa',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('id_sequences table schema ensured.');

        // 2. Add custom_id to users table
        console.log('Checking users table for custom_id column...');
        const [columns] = await connection.query(`SHOW COLUMNS FROM users LIKE 'custom_id'`);

        if (columns.length === 0) {
            console.log('Adding custom_id column to users table...');
            await connection.query(`
                ALTER TABLE users 
                ADD COLUMN custom_id VARCHAR(20) UNIQUE DEFAULT NULL AFTER id
            `);
            console.log('custom_id column added.');
        } else {
            console.log('custom_id column already exists.');
        }

        // 3. Initialize current year sequence if not exists
        const currentYear = new Date().getFullYear() % 100; // e.g., 26 for 2026
        console.log(`Initializing sequence for year ${currentYear}...`);

        await connection.query(`
            INSERT IGNORE INTO id_sequences (year, last_letter_sequence) VALUES (?, 'aa')
        `, [currentYear]);

        // Verify table existence
        console.log('Verifying table existence...');
        const [tables] = await connection.query('SHOW TABLES LIKE "id_sequences"');
        console.log('Tables found:', tables);

        const [rows] = await connection.query('SELECT * FROM id_sequences');
        console.log('Rows in id_sequences:', rows);

        console.log('Migration completed successfully.');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
