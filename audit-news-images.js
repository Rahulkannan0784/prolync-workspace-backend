
import db from './config/db.js';

async function auditNewsImages() {
    try {
        const [rows] = await db.query("SELECT id, title, image_url, category FROM news");
        console.log(JSON.stringify(rows, null, 2));
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

auditNewsImages();
