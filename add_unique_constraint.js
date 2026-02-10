
import mysql from 'mysql2/promise';

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'admin@123',
    database: 'workspace'
};

async function addUniqueConstraint() {
    try {
        const connection = await mysql.createConnection(dbConfig);

        // Add UNIQUE constraint
        // Note: In MySQL, multiple NULL values are allowed in a UNIQUE index.
        try {
            await connection.query("ALTER TABLE users ADD CONSTRAINT unique_register_no UNIQUE (register_no)");
            console.log("UNIQUE constraint added to 'register_no'.");
        } catch (e) {
            if (e.code === 'ER_DUP_KEYNAME') {
                console.log("Constraint already exists.");
            } else {
                console.error("Error adding constraint:", e.message);
            }
        }

        await connection.end();
    } catch (error) {
        console.error('Database connection error:', error);
    }
}

addUniqueConstraint();
