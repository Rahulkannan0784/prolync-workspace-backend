
import db from './config/db.js';

async function batchFixImages() {
    try {
        // Update all news items where image_url starts with http (dummy external links)
        // to use the valid local image we found.
        const query = `
            UPDATE news 
            SET image_url = '/uploads/news/image-1768198690870.webp' 
            WHERE image_url LIKE 'http%'
        `;
        const [result] = await db.query(query);
        console.log('Batch fix result:', result);
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

batchFixImages();
