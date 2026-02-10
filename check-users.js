
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Manually load env from correct path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function checkUsers() {
    console.log("-----------------------------------------");
    console.log("🔍 Checking Users Table...");
    console.log(`   Host: ${process.env.DB_HOST}`);
    console.log(`   Database: ${process.env.DB_NAME}`);
    console.log("-----------------------------------------");

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        // 1. Total Count
        const [count] = await connection.query('SELECT COUNT(*) as total FROM users');
        console.log(`\n📊 Total Users in DB: ${count[0].total}`);

        // 2. List All Users
        const [rows] = await connection.query('SELECT id, name, email, role, status FROM users');
        console.log("\n👤 User List:");
        if (rows.length === 0) {
            console.log("   (No users found)");
        } else {
            rows.forEach(r => console.log(`   [${r.id}] ${r.name} (${r.email}) - ${r.role} [${r.status}]`));
        }

        await connection.end();

    } catch (error) {
        console.error("\n❌ Connection Failed:", error.message);
    }
}

checkUsers();
