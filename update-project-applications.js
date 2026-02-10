
import db from './config/db.js';

const updateProjectApplicationsTable = async () => {
    try {
        // Add new columns
        const addColumnsQuery = `
            ALTER TABLE project_applications
            ADD COLUMN github_url VARCHAR(255),
            ADD COLUMN live_url VARCHAR(255),
            ADD COLUMN tech_stack_used VARCHAR(255),
            ADD COLUMN submission_notes TEXT,
            ADD COLUMN screenshots JSON;
        `;

        // Update ENUM for status
        // Note: checking if columns exist is tricky in raw SQL without stored procedures, 
        // but for this env we assume they don't exist yet or we handle error gracefully-ish or just run it.
        // For existing table modification, usually we just run ALTER.

        try {
            await db.query(addColumnsQuery);
            console.log("Columns added to project_applications.");
        } catch (e) {
            console.log("Error adding columns (might already exist):", e.message);
        }

        const modifyStatusQuery = `
            ALTER TABLE project_applications
            MODIFY COLUMN status ENUM('Pending', 'Interested', 'Submitted', 'Changes Required', 'Completed', 'Rejected') DEFAULT 'Pending'; 
        `;
        // Note: Keeping 'Pending' for backward compatibility if needed, but 'Interested' is the new initial state.
        // 'Submitted' will be the state after form submission (waiting for review).

        await db.query(modifyStatusQuery);
        console.log("Status ENUM updated.");

    } catch (err) {
        console.error("Error updating table:", err);
    } finally {
        process.exit();
    }
};

updateProjectApplicationsTable();
