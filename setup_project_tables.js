
import db from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const setupTables = async () => {
    try {
        console.log('Setting up Project tables...');

        const safeAddColumn = async (table, columnDef) => {
            try {
                await db.query(`ALTER TABLE ${table} ADD COLUMN ${columnDef}`);
                console.log(`Added column: ${columnDef.split(' ')[0]}`);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`Column ${columnDef.split(' ')[0]} already exists.`);
                } else {
                    console.error(`Error adding column ${columnDef}:`, err.message);
                }
            }
        };

        // 1. Fix 'projects' table
        try {
            console.log("Updating 'projects' table schema...");

            await safeAddColumn('projects', 'detailed_overview TEXT');
            await safeAddColumn('projects', 'technology_stack TEXT');
            await safeAddColumn('projects', 'learning_objectives TEXT');
            await safeAddColumn('projects', 'key_requirements TEXT');
            await safeAddColumn('projects', 'submission_deadline DATETIME');

            // Rename logic check
            try {
                await db.query(`ALTER TABLE projects RENAME COLUMN has_internship TO is_internship`);
                console.log('Renamed has_internship -> is_internship');
            } catch (e) {
                if (e.code !== 'ER_BAD_FIELD_ERROR' && e.code !== 'ER_PARSE_ERROR') console.log('Rename has_internship msg:', e.message);
            }

            try {
                await db.query(`ALTER TABLE projects RENAME COLUMN participants_count TO max_participants`);
                console.log('Renamed participants_count -> max_participants');
            } catch (e) {
                if (e.code !== 'ER_BAD_FIELD_ERROR' && e.code !== 'ER_PARSE_ERROR') console.log('Rename participants_count msg:', e.message);
            }

            // Ensure renamed columns exist if rename failed (e.g. already renamed or didn't exist)
            await safeAddColumn('projects', 'is_internship BOOLEAN DEFAULT FALSE');
            await safeAddColumn('projects', 'max_participants INT DEFAULT 1');

            console.log('Projects table schema updated.');
        } catch (err) {
            console.error('Error updating projects table:', err);
        }

        // 2. Create 'project_applications' table
        try {
            console.log("Creating/Verifying 'project_applications' table...");
            const createAppsTable = `
                CREATE TABLE IF NOT EXISTS project_applications (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    project_id INT NOT NULL,
                    student_id INT NOT NULL,
                    status VARCHAR(50) DEFAULT 'Interested',
                    github_url VARCHAR(255),
                    live_url VARCHAR(255),
                    tech_stack_used VARCHAR(255),
                    submission_notes TEXT,
                    screenshots TEXT,
                    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
                )
            `;
            await db.query(createAppsTable);
            console.log('project_applications table ready.');
        } catch (err) {
            console.error('Error creating project_applications table:', err);
        }

        process.exit(0);
    } catch (error) {
        console.error('Setup failed:', error);
        process.exit(1);
    }
};

setupTables();
