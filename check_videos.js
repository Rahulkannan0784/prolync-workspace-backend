import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const checkVideos = async () => {
    try {
        const conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        const [modCols] = await conn.query("DESCRIBE modules");
        console.log("Modules Columns:", modCols.map(c => c.Field));

        const [courseCols] = await conn.query("DESCRIBE courses");
        console.log("Courses Columns:", courseCols.map(c => c.Field));

        await conn.end();
    } catch (e) {
        console.error(e);
    }
};

checkVideos();
