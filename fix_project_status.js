import db from './config/db.js';

async function fixProjectStatusColumn() {
    try {
        console.log('🔧 Fixing project_applications status column...\n');

        // First, check current column definition
        const [cols] = await db.query(`
            SHOW COLUMNS FROM project_applications WHERE Field = 'status'
        `);
        console.log('Current column definition:', cols[0]);

        // Update column to accept all required status values
        await db.query(`
            ALTER TABLE project_applications 
            MODIFY COLUMN status VARCHAR(50) DEFAULT 'Interested'
        `);

        console.log('\n✅ Status column updated successfully!');
        console.log('   - Type: VARCHAR(50)');
        console.log('   - Accepts: Interested, Submitted, Approved, Completed, Changes Required, Rejected');
        console.log('\n📊 Verifying change...');

        const [newCols] = await db.query(`
            SHOW COLUMNS FROM project_applications WHERE Field = 'status'
        `);
        console.log('New column definition:', newCols[0]);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixProjectStatusColumn();
