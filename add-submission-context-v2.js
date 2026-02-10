
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function addSubmissionContext() {
    try {
        console.log('Adding context columns to submissions table...');

        // Add context_type main column
        try {
            await pool.query(`
                ALTER TABLE submissions 
                ADD COLUMN context_type ENUM('problem', 'kit', 'scenario') DEFAULT 'problem'
            `);
            console.log('Added context_type column');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('context_type column already exists');
            } else {
                throw err;
            }
        }

        // Add context_id column (e.g., 'kit-1', 'sc-1')
        try {
            await pool.query(`
                ALTER TABLE submissions 
                ADD COLUMN context_id VARCHAR(255) DEFAULT NULL
            `);
            console.log('Added context_id column');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('context_id column already exists');
            } else {
                throw err;
            }
        }

        console.log('Schema update complete!');
        process.exit(0);
    } catch (error) {
        console.error('Error updating schema:', error);
        process.exit(1);
    }
}

addSubmissionContext();
