
import db from './config/db.js';

async function testLoginQuery() {
    try {
        console.log("Testing query: SELECT * FROM admin WHERE email = 'test'");
        const [admins] = await db.query('SELECT * FROM admin WHERE email = ?', ['test']);
        console.log('Query success. Result:', admins);

    } catch (error) {
        console.error('Admin Query failed:', error.message);
    }

    try {
        console.log("Testing query: SELECT * FROM users WHERE email = 'test'");
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', ['test']);
        console.log('User Query success. Result:', users);
    } catch (error) {
        console.error('User Query failed:', error.message);
    }
    process.exit();
}

testLoginQuery();
