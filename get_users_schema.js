
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'student_workspace_db',
};

async function checkSchema() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        const [rows] = await connection.query('SHOW COLUMNS FROM users');
        const targetCols = rows
            .filter(r => ['gender', 'role'].includes(r.Field))
            .map(r => ({ Field: r.Field, Type: r.Type, Default: r.Default }));
        console.log(JSON.stringify(targetCols, null, 2));

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkSchema();
