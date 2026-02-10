import db from './config/db.js';

async function createPlacementBlogsTable() {
    try {
        console.log('🔧 Creating placement_blogs table...\n');

        await db.query(`
            CREATE TABLE IF NOT EXISTS placement_blogs (
                id INT PRIMARY KEY AUTO_INCREMENT,
                title VARCHAR(255) NOT NULL,
                category ENUM('Placement Quotes', 'Interview Preparation', 'Technical Questions', 'Last-Minute Tips') NOT NULL,
                short_description TEXT,
                content TEXT NOT NULL,
                thumbnail VARCHAR(500),
                status ENUM('Active', 'Inactive') DEFAULT 'Active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_status (status),
                INDEX idx_category (category)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        console.log('✅ placement_blogs table created successfully!');

        // Insert sample data
        console.log('\n📝 Inserting sample blogs...');

        await db.query(`
            INSERT INTO placement_blogs (title, category, short_description, content, status) VALUES
            ('Believe in Yourself', 'Placement Quotes', 'Motivation for your placement journey', 'Success is not final, failure is not fatal: it is the courage to continue that counts. Your placement journey is just beginning!', 'Active'),
            ('Ace Your Interview', 'Interview Preparation', 'Essential tips for cracking interviews', 'Prepare thoroughly, research the company, practice common questions, and most importantly - be yourself. Confidence comes from preparation.', 'Active'),
            ('Top 50 DSA Questions', 'Technical Questions', 'Must-know DSA problems for placements', 'Array manipulation, LinkedList operations, Binary Search variations, and Dynamic Programming - master these core concepts.', 'Active')
        `);

        console.log('✅ Sample blogs inserted!');

        // Verify
        const [rows] = await db.query('SELECT id, title, category, status FROM placement_blogs');
        console.log(`\n📊 Created ${rows.length} sample blogs:`);
        rows.forEach(blog => {
            console.log(`   ${blog.id}. ${blog.title} [${blog.category}] - ${blog.status}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createPlacementBlogsTable();
