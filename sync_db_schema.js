import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const syncSchema = async () => {
    try {
        console.log(`Connecting to database: ${process.env.DB_NAME}`);
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('Connected successfully.');

        // Add 'department' column
        try {
            await connection.query("ALTER TABLE users ADD COLUMN department VARCHAR(100) DEFAULT NULL");
            console.log("Added 'department' column.");
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log("'department' column already exists.");
            } else {
                console.error("Error adding 'department' column:", err.message);
            }
        }

        // Add 'valid_until' column
        try {
            await connection.query("ALTER TABLE users ADD COLUMN valid_until DATETIME DEFAULT NULL");
            console.log("Added 'valid_until' column.");
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log("'valid_until' column already exists.");
            } else {
                console.error("Error adding 'valid_until' column:", err.message);
            }
        }

        // Add 'custom_id' column
        try {
            await connection.query("ALTER TABLE users ADD COLUMN custom_id VARCHAR(50) DEFAULT NULL");
            console.log("Added 'custom_id' column.");
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log("'custom_id' column already exists.");
            } else {
                console.error("Error adding 'custom_id' column:", err.message);
            }
        }

        await connection.end();
        console.log('Schema sync completed.');

    } catch (error) {
        console.error('Migration failed:', error);
    }
};

syncSchema();
