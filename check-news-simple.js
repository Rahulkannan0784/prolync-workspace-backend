import db from './config/db.js';

const checkNews = async () => {
    try {
        const [rows] = await db.query("SELECT id, title, image_url FROM news");
        rows.forEach(r => {
            console.log(`ID: ${r.id} | Title: ${r.title.substring(0, 30)}... | Image: ${r.image_url}`);
        });
        process.exit(0);
    } catch (error) {
        process.exit(1);
    }
};

checkNews();
