import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'prolync_db'
};

async function addContactVisibilityColumns() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log("Connected to database.");

        const columns = [
            'show_email',
            'show_phone'
        ];

        for (const col of columns) {
            // Check if column exists
            const [rows] = await connection.query(`
                SELECT count(*) as count 
                FROM information_schema.columns 
                WHERE table_schema = ? 
                AND table_name = 'users' 
                AND column_name = ?
            `, [dbConfig.database, col]);

            if (rows[0].count === 0) {
                console.log(`Adding column: ${col}...`);
                await connection.query(`
                    ALTER TABLE users 
                    ADD COLUMN ${col} BOOLEAN DEFAULT FALSE
                `);
                console.log(`✅ Added ${col} (Default: FALSE)`);
            } else {
                console.log(`ℹ️ Column ${col} already exists.`);
            }
        }

        console.log("Migration completed successfully.");

    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        if (connection) await connection.end();
    }
}

addContactVisibilityColumns();
