import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' }); // Try explicit path
console.log("DB_USER:", process.env.DB_USER); // Debug log

const fixSchema = async () => {
    console.log("Starting schema fix...");
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log("Fixing user_progress table...");
        // Add columns if they strictly don't exist (using try-catch for "Duplicate column name" error)
        try { await conn.query("ALTER TABLE user_progress ADD COLUMN completion_percent INT DEFAULT 0"); } catch (e) { console.log("completion_percent existing or error:", e.code); }
        try { await conn.query("ALTER TABLE user_progress ADD COLUMN total_modules INT DEFAULT 0"); } catch (e) { console.log("total_modules existing or error:", e.code); }
        try { await conn.query("ALTER TABLE user_progress ADD COLUMN completed_modules INT DEFAULT 0"); } catch (e) { console.log("completed_modules existing or error:", e.code); }

        console.log("Fixing enrollments table...");
        try { await conn.query("ALTER TABLE enrollments ADD COLUMN progress INT DEFAULT 0"); } catch (e) { console.log("progress existing or error:", e.code); }
        try { await conn.query("ALTER TABLE enrollments ADD COLUMN completed BOOLEAN DEFAULT FALSE"); } catch (e) { console.log("completed existing or error:", e.code); }

        console.log("Schema fix completed.");
    } catch (e) {
        console.error("Critical error fixing schema:", e);
    } finally {
        await conn.end();
    }
};

fixSchema();
