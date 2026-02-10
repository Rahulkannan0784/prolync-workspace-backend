import db from './config/db.js';

async function setupJobApplications() {
    try {
        console.log('Checking for job_applications table...');
        const [rows] = await db.query("SHOW TABLES LIKE 'job_applications'");

        if (rows.length === 0) {
            console.log('Creating job_applications table...');
            await db.query(`
                CREATE TABLE job_applications (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    job_id INT NOT NULL,
                    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    status VARCHAR(50) DEFAULT 'Applied',
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (job_id) REFERENCES jobs(job_id) ON DELETE CASCADE,
                    UNIQUE KEY unique_app (user_id, job_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            `);
            console.log('Table created successfully.');
        } else {
            console.log('Table already exists.');
        }

        // Also check activity_logs table
        const [activityRows] = await db.query("SHOW TABLES LIKE 'activity_logs'");
        if (activityRows.length === 0) {
            console.log('Creating activity_logs table...');
            await db.query(`
                CREATE TABLE activity_logs (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    action VARCHAR(100) NOT NULL,
                    details TEXT,
                    ip_address VARCHAR(45),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            `);
            console.log('Activity logs table created.');
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

setupJobApplications();
