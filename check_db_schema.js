const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    try {
        console.log('Connecting to database:', process.env.DB_NAME);
        const db = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        const [rows] = await db.query('DESCRIBE users');
        const columns = rows.map(r => r.Field);
        console.log('Columns in users table:', columns.join(', '));

        const missing = [];
        if (!columns.includes('department')) missing.push('department');
        if (!columns.includes('valid_until')) missing.push('valid_until');
        if (!columns.includes('custom_id')) missing.push('custom_id');

        if (missing.length > 0) {
            console.log('MISSING COLUMNS:', missing.join(', '));
        } else {
            console.log('All required columns present.');
        }

        await db.end();
    } catch (e) {
        console.error('Error:', e);
    }
})();
