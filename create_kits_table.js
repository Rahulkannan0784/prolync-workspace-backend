import db from './config/db.js';

const createCodingKitsTable = async () => {
    try {
        console.log("Creating 'coding_kits' table if not exists...");

        // Create Kits Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS coding_kits (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                subtitle VARCHAR(255),
                description TEXT,
                difficulty ENUM('Easy', 'Medium', 'Hard', 'Mixed') DEFAULT 'Mixed',
                icon VARCHAR(50) DEFAULT 'Box',
                color VARCHAR(50) DEFAULT 'blue',
                total_problems INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("'coding_kits' table created/checked.");

        console.log("Adding 'kit_id' column to 'questions' table...");

        // Add kit_id to questions
        const [columns] = await db.query("SHOW COLUMNS FROM questions LIKE 'kit_id'");
        if (columns.length === 0) {
            await db.query("ALTER TABLE questions ADD COLUMN kit_id INT DEFAULT NULL");
            await db.query("ALTER TABLE questions ADD CONSTRAINT fk_kit FOREIGN KEY (kit_id) REFERENCES coding_kits(id) ON DELETE SET NULL");
            console.log("'kit_id' column added to 'questions'.");
        } else {
            console.log("'kit_id' column already exists.");
        }

    } catch (error) {
        console.error("Error migrating DB:", error);
    } finally {
        process.exit();
    }
};

createCodingKitsTable();
