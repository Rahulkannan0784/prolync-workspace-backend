import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

async function addEmailColumn() {
    try {
        console.log("Adding email column to feedback table...");
        await pool.query("ALTER TABLE feedback ADD COLUMN email VARCHAR(255) NULL");
        console.log("Added email column.");
        process.exit();
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log("Email column already exists.");
            process.exit();
        }
        console.error("Error adding email column:", error);
        process.exit(1);
    }
}

addEmailColumn();
