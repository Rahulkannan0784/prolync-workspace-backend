
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Manually load env from correct path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function checkDB() {
    console.log("-----------------------------------------");
    console.log("🔍 Checking Database Connection...");
    console.log(`   Host: ${process.env.DB_HOST}`);
    console.log(`   User: ${process.env.DB_USER}`);
    console.log(`   Database: ${process.env.DB_NAME}`);
    console.log("-----------------------------------------");

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log("✅ Successfully Connected to MySQL!");

        // Check Questions
        const [rows] = await connection.query('SELECT id, title, created_at FROM questions ORDER BY id DESC LIMIT 5');
        console.log("\n📄 Latest 5 Questions in DB:");
        if (rows.length === 0) {
            console.log("   (No questions found)");
        } else {
            rows.forEach(r => console.log(`   [${r.id}] ${r.title} (Created: ${r.created_at})`));
        }

        // Count total
        const [count] = await connection.query('SELECT COUNT(*) as total FROM questions');
        console.log(`\n📊 Total Questions: ${count[0].total}`);

        await connection.end();

    } catch (error) {
        console.error("\n❌ Connection Failed:", error.message);
    }
}

checkDB();
