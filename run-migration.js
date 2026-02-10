
import db from './config/db.js';

async function runMigration() {
    console.log("Starting Migration...");

    try {
        // STEP 1: Fill NULL custom_ids
        console.log("Step 1: Filling NULL custom_ids...");
        await db.query(`UPDATE users SET custom_id = CONCAT('prln_', LEFT(UUID(), 8)) WHERE custom_id IS NULL OR custom_id = ''`);

        // STEP 2: Drop FKs
        console.log("Step 2: Dropping Foreign Keys...");
        const tables = [
            { table: 'activity_logs', constraint: 'activity_logs_ibfk_1' },
            { table: 'enrollments', constraint: 'enrollments_ibfk_1' },
            { table: 'shared_progress', constraint: 'shared_progress_ibfk_1' },
            { table: 'student_video_progress', constraint: 'student_video_progress_ibfk_1' },
            { table: 'submissions', constraint: 'submissions_ibfk_2' },
            { table: 'user_badges', constraint: 'user_badges_ibfk_1' },
            { table: 'user_progress', constraint: 'user_progress_ibfk_1' },
            { table: 'certificates', constraint: 'certificates_ibfk_1' },
            { table: 'course_ratings', constraint: 'course_ratings_ibfk_1' },
            { table: 'coding_streak', constraint: 'coding_streak_ibfk_1' },
            { table: 'job_applications', constraint: 'job_applications_ibfk_1' },
            { table: 'learning_activity', constraint: 'learning_activity_ibfk_1' },
            { table: 'learning_streak', constraint: 'learning_streak_ibfk_1' }
        ];

        for (const t of tables) {
            try {
                await db.query(`ALTER TABLE ${t.table} DROP FOREIGN KEY ${t.constraint}`);
                console.log(`  Dropped FK from ${t.table}`);
            } catch (e) {
                console.log(`  Warning: Could not drop FK from ${t.table} (might not exist): ${e.message}`);
            }
        }

        // STEP 3: Remove Auto Increment
        console.log("Step 3: Removing Auto Increment from ID...");
        await db.query("ALTER TABLE users MODIFY id INT NOT NULL");

        // STEP 4: Drop Primary Key
        console.log("Step 4: Dropping Primary Key...");
        await db.query("ALTER TABLE users DROP PRIMARY KEY");

        // STEP 5: Ensure custom_id is NOT NULL
        console.log("Step 5: Modifying custom_id to NOT NULL...");
        await db.query("ALTER TABLE users MODIFY custom_id VARCHAR(20) NOT NULL");

        // STEP 6: Add New Primary Key
        console.log("Step 6: Setting custom_id as Primary Key...");
        await db.query("ALTER TABLE users ADD PRIMARY KEY (custom_id)");

        // STEP 7: Re-enable Auto Increment (Make id UNIQUE first)
        console.log("Step 7: Re-enabling Auto Increment on ID...");
        await db.query("ALTER TABLE users ADD UNIQUE INDEX (id)");
        await db.query("ALTER TABLE users MODIFY id INT AUTO_INCREMENT");

        // STEP 8: Restore FKs
        console.log("Step 8: Restoring Foreign Keys...");
        for (const t of tables) {
            try {
                await db.query(`ALTER TABLE ${t.table} ADD CONSTRAINT ${t.constraint} FOREIGN KEY (user_id) REFERENCES users(id)`);
                console.log(`  Restored FK on ${t.table}`);
            } catch (e) {
                console.error(`  Error restoring FK on ${t.table}: ${e.message}`);
            }
        }

        console.log("Migration Completed Successfully!");
        process.exit();

    } catch (error) {
        console.error("Migration Failed:", error);
        process.exit(1);
    }
}

runMigration();
