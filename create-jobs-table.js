import db from './config/db.js';

const createJobTable = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS jobs (
                job_id INT AUTO_INCREMENT PRIMARY KEY,
                job_title VARCHAR(150) NOT NULL,
                company_name VARCHAR(150) NOT NULL,
                job_type ENUM('Internship', 'Full-time', 'Part-time', 'Contract') NOT NULL,
                work_mode ENUM('Onsite', 'Remote', 'Hybrid') NOT NULL,
                location VARCHAR(150),
                salary_package VARCHAR(100),
                required_skills VARCHAR(255),
                job_description TEXT,
                application_deadline DATE,
                application_link VARCHAR(255),
                status ENUM('Active', 'Inactive', 'Closed') DEFAULT 'Active',
                created_by VARCHAR(100) DEFAULT 'Admin',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );
        `);
        console.log('Jobs table created successfully');
        process.exit();
    } catch (err) {
        console.error('Error creating jobs table:', err);
        process.exit(1);
    }
};

createJobTable();
