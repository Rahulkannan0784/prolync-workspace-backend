
import db from './config/db.js';

async function checkNews() {
    try {
        const [rows] = await db.query("SELECT id, title, image_url, category FROM news WHERE title LIKE '%JEE%'");
        console.log(JSON.stringify(rows, null, 2));
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkNews();
