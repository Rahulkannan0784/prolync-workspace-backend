import db from './config/db.js';

const checkNews = async () => {
    try {
        const [rows] = await db.query("SELECT id, title, image_url, category FROM news WHERE title LIKE '%JEE Main%'");
        console.log("News Items found:");
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

checkNews();
