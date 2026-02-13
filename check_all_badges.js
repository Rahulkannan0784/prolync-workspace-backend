import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

async function checkAllBadges() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log('=== ALL BADGES IN DATABASE ===');
    const [badges] = await db.query('SELECT * FROM badges ORDER BY id');
    console.log(`Total badges found: ${badges.length}\n`);
    badges.forEach((badge, i) => {
        console.log(`${i + 1}. ${badge.name} - ${badge.description} (Icon: ${badge.icon})`);
    });

    console.log('\n=== CHECKING FOR OTHER BADGE-RELATED TABLES ===');
    const [tables] = await db.query("SHOW TABLES LIKE '%badge%'");
    console.table(tables);

    console.log('\n=== CHECKING FOR ACHIEVEMENT-RELATED TABLES ===');
    const [achievementTables] = await db.query("SHOW TABLES LIKE '%achievement%'");
    console.table(achievementTables);

    await db.end();
}

checkAllBadges().catch(console.error);
