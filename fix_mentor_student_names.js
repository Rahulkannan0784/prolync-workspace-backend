import db from './config/db.js';

async function recreateMentorBookingsTable() {
    try {
        console.log('🔧 Fixing mentor_bookings table structure...\n');

        // First, backup existing data
        const [existingData] = await db.query('SELECT * FROM mentor_bookings');
        console.log(`📦 Backing up ${existingData.length} existing bookings...`);

        // Drop and recreate table with proper structure
        await db.query('DROP TABLE IF EXISTS mentor_bookings');
        console.log('✅ Old table dropped');

        await db.query(`
            CREATE TABLE mentor_bookings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT,
                student_name VARCHAR(255),
                mentor_name VARCHAR(255),
                topic VARCHAR(500),
                slot_time VARCHAR(255),
                status VARCHAR(50) DEFAULT 'Scheduled',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_student (student_id),
                INDEX idx_status (status)
            )
        `);
        console.log('✅ New table created with proper structure');

        // Restore data with student names from users table
        if (existingData.length > 0) {
            console.log('\n🔄 Restoring data with student names...');

            for (const row of existingData) {
                // Try to get student name from users table if we have an ID
                let studentName = row.student_name;

                if (!studentName && row.student_id) {
                    const [users] = await db.query('SELECT name FROM users WHERE id = ?', [row.student_id]);
                    if (users.length > 0) {
                        studentName = users[0].name;
                    }
                }

                await db.query(`
                    INSERT INTO mentor_bookings 
                    (student_id, student_name, mentor_name, topic, slot_time, status, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [
                    row.student_id || null,
                    studentName || 'Unknown Student',
                    row.mentor_name,
                    row.topic,
                    row.slot_time,
                    row.status || 'Scheduled',
                    row.created_at
                ]);
            }
            console.log(`✅ Restored ${existingData.length} bookings`);
        }

        // Show final result
        const [finalData] = await db.query(`
            SELECT student_name, mentor_name, topic, slot_time, status 
            FROM mentor_bookings 
            ORDER BY created_at DESC
        `);

        console.log(`\n📊 Final count: ${finalData.length} bookings\n`);
        console.log('📋 All bookings:');
        finalData.forEach((booking, i) => {
            console.log(`\n${i + 1}. ${booking.student_name} → ${booking.mentor_name}`);
            console.log(`   Topic: ${booking.topic}`);
            console.log(`   Time: ${booking.slot_time}`);
            console.log(`   Status: ${booking.status}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

recreateMentorBookingsTable();
