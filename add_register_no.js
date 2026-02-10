
import mysql from 'mysql2/promise';

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'admin@123',
    database: 'workspace'
};

async function addRegisterNo() {
    try {
        const connection = await mysql.createConnection(dbConfig);

        // Check if column exists
        const [columns] = await connection.query("SHOW COLUMNS FROM users LIKE 'register_no'");
        if (columns.length > 0) {
            console.log("Column 'register_no' already exists.");
        } else {
            // Add column
            await connection.query("ALTER TABLE users ADD COLUMN register_no VARCHAR(50) AFTER custom_id");
            console.log("Column 'register_no' added successfully.");
        }

        await connection.end();
    } catch (error) {
        console.error('Error modifying schema:', error);
    }
}

addRegisterNo();
