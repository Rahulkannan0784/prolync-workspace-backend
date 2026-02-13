import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

async function checkBadges() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log('=== BADGES TABLE ===');
    const [badges] = await db.query('SELECT * FROM badges');
    console.table(badges);

    console.log('\n=== USER_BADGES TABLE STRUCTURE ===');
    const [userBadgesStructure] = await db.query('DESCRIBE user_badges');
    console.table(userBadgesStructure);

    console.log('\n=== SAMPLE USER_BADGES DATA ===');
    const [userBadges] = await db.query('SELECT * FROM user_badges LIMIT 10');
    console.table(userBadges);

    await db.end();
}

checkBadges().catch(console.error);
