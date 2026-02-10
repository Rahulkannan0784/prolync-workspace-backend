
import db from './config/db.js';

async function getAdmin() {
    try {
        const [admins] = await db.query('SELECT * FROM admin');
        console.log('Admins found:', admins.length);
        admins.forEach(admin => {
            console.log(`Email: ${admin.email}, Password: ${admin.password}`);
        });
        process.exit();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

getAdmin();
