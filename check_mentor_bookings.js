import db from './config/db.js';

async function checkMentorBookings() {
    try {
        console.log('🔍 Checking mentor_bookings table...\n');

        // Check if table exists
        const [tables] = await db.query("SHOW TABLES LIKE 'mentor_bookings'");
        if (tables.length === 0) {
            console.log('❌ mentor_bookings table does NOT exist!');
            console.log('Creating table...');

            await db.query(`
                CREATE TABLE mentor_bookings (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    student_id INT,
                    student_name VARCHAR(255),
                    mentor_name VARCHAR(255),
                    topic VARCHAR(255),
                    slot_time VARCHAR(255),
                    status VARCHAR(50) DEFAULT 'Scheduled',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ mentor_bookings table created!');
        } else {
            console.log('✅ mentor_bookings table exists');
        }

        // Check data
        const [rows] = await db.query('SELECT * FROM mentor_bookings ORDER BY created_at DESC LIMIT 10');
        console.log(`\n📊 Total bookings in table: ${rows.length}`);

        if (rows.length > 0) {
            console.log('\n📋 Sample bookings:');
            rows.forEach((booking, i) => {
                console.log(`\n${i + 1}. ${booking.student_name} → ${booking.mentor_name}`);
                console.log(`   Topic: ${booking.topic}`);
                console.log(`   Time: ${booking.slot_time}`);
                console.log(`   Status: ${booking.status}`);
            });
        } else {
            console.log('\n⚠️  No bookings found in database');
            console.log('   Students need to book mentors first!');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkMentorBookings();
