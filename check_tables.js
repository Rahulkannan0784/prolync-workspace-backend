
import mysql from 'mysql2/promise';

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'admin@123',
    database: 'workspace'
};

const tablesToCheck = [
    'users',
    'enrollments',
    'courses',
    'submissions',
    'project_applications',
    'projects',
    'mentorship_sessions',
    'placements',
    'activity_logs'
];

async function checkDatabase() {
    let connection;
    try {
        console.log(`Connecting to database: ${dbConfig.database}...`);
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected!');

        console.log('\n--- Checking Tables ---');
        const [rows] = await connection.query('SHOW TABLES');
        const existingTables = rows.map(r => Object.values(r)[0]);

        for (const table of tablesToCheck) {
            if (existingTables.includes(table)) {
                console.log(`✅ Table '${table}' exists.`);
                // Describe
                const [cols] = await connection.query(`DESCRIBE ${table}`);
                const colNames = cols.map(c => `${c.Field} (${c.Type})`).join(', ');
                console.log(`   Columns: ${colNames}`);
            } else {
                console.log(`❌ Table '${table}' DOES NOT EXIST.`);
            }
        }

    } catch (error) {
        console.error('Database check failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

checkDatabase();
