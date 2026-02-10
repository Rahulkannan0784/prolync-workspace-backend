
import mysql from 'mysql2/promise';

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'admin@123',
    database: 'workspace'
};

async function inspectUsers() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [columns] = await connection.query('SHOW COLUMNS FROM users');
        console.log('Users Table Columns:');
        columns.forEach(col => console.log(`${col.Field} (${col.Type})`));
        await connection.end();
    } catch (error) {
        console.error('Error inspecting schema:', error);
    }
}

inspectUsers();
