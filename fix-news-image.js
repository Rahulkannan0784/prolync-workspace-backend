
import db from './config/db.js';

async function fixNewsImage() {
    try {
        const query = `
            UPDATE news 
            SET image_url = '/uploads/news/image-1768198690870.webp' 
            WHERE title = 'JEE Main 2026 Registration Opens'
        `;
        const [result] = await db.query(query);
        console.log('Update result:', result);
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

fixNewsImage();
