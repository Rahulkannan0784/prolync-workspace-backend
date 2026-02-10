import db from './config/db.js';
import fs from 'fs';

const checkNews = async () => {
    try {
        const [rows] = await db.query("SELECT id, title, image_url, category FROM news");
        const output = rows.map(r => `ID: ${r.id}\nTitle: ${r.title}\nCategory: ${r.category}\nImage: ${r.image_url}\n-------------------`).join('\n');
        fs.writeFileSync('news-db-output.txt', output);
        console.log("Output written to news-db-output.txt");
        process.exit(0);
    } catch (error) {
        fs.writeFileSync('news-db-output.txt', "Error: " + error.message);
        process.exit(1);
    }
};

checkNews();
