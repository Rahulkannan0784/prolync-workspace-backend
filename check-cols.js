
import db from './config/db.js';

async function checkCols() {
    try {
        const [cols] = await db.query("DESCRIBE admin");
        const fields = cols.map(c => c.Field);
        console.log('Fields:', fields);
        console.log('Has email:', fields.includes('email'));
        console.log('Has password:', fields.includes('password'));
        process.exit();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkCols();
