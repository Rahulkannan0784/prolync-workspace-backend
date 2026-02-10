
import db from './config/db.js';

const createProjectsTable = async () => {
    try {
        const queryPro = `
            CREATE TABLE IF NOT EXISTS projects (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                detailed_overview TEXT,
                status ENUM('Active', 'Closed') DEFAULT 'Active',
                is_internship BOOLEAN DEFAULT FALSE,
                duration VARCHAR(100),
                difficulty ENUM('Beginner', 'Intermediate', 'Advanced') DEFAULT 'Beginner',
                max_participants INT DEFAULT 1,
                submission_deadline DATE,
                technology_stack JSON,
                learning_objectives JSON,
                key_requirements JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `;
        await db.query(queryPro);
        console.log("Projects table created successfully.");

        const queryApp = `
            CREATE TABLE IF NOT EXISTS project_applications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                project_id INT NOT NULL,
                student_id INT NOT NULL,
                status ENUM('Pending', 'In Progress', 'Completed') DEFAULT 'Pending',
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            )
        `;
        // Note: We are not referencing student_id to users(id) strictly here to avoid errors if users table has different id type or if strict mode is on, assuming app logic handles it. 
        // But ideally it should. Let's assume student_id matches users table id.

        await db.query(queryApp);
        console.log("Project Applications table created successfully.");

    } catch (err) {
        console.error("Error creating tables:", err);
    } finally {
        process.exit();
    }
};

createProjectsTable();
