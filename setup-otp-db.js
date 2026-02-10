
import db from './config/db.js';

async function setupOtpDb() {
    try {
        console.log("Setting up OTP Database tables...");

        // 1. Create otp_codes table
        const createOtpTable = `
      CREATE TABLE IF NOT EXISTS otp_codes (
        email VARCHAR(255) PRIMARY KEY,
        otp_code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (email)
      );
    `;
        await db.query(createOtpTable);
        console.log("Created table 'otp_codes'.");

        // 2. Add is_verified to users table if it doesn't exist
        // Check if column exists
        const [columns] = await db.query(`SHOW COLUMNS FROM users LIKE 'is_verified'`);
        if (columns.length === 0) {
            await db.query(`ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE`);
            console.log("Added 'is_verified' column to 'users' table.");
        } else {
            console.log("'is_verified' column already exists in 'users' table.");
        }

        process.exit(0);
    } catch (error) {
        console.error("Error setting up DB:", error);
        process.exit(1);
    }
}

setupOtpDb();
