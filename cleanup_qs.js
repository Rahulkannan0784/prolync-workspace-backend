import db from './config/db.js';

async function cleanup() {
    try {
        console.log("Starting cleanup...");

        // 1. Restore ID 1 to "Two Sum"
        console.log("Restoring ID 1 to 'Two Sum'...");
        const twoSumDesc = "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.";

        await db.query(`
            UPDATE questions 
            SET title = ?, description = ?, difficulty = 'Easy', difficulty_normalized = 'easy', 
                time_limit = 1, memory_limit = 256, status = 'Published', category = 'DSA',
                constraints = '2 <= nums.length <= 10^4'
            WHERE id = 1
        `, ["Two Sum", twoSumDesc]);

        // Fix Test Cases for ID 1
        await db.query('DELETE FROM test_cases WHERE question_id = 1');
        const twoSumCases = [
            [1, "2 7 11 15\n9", "[0, 1]", false],
            [1, "3 2 4\n6", "[1, 2]", false],
            [1, "3 3\n6", "[0, 1]", true]
        ];
        await db.query(`INSERT INTO test_cases (question_id, input, expected_output, is_hidden) VALUES ?`, [twoSumCases]);
        console.log("Restored 'Two Sum' (ID 1).");

        // 2. Identify redundant copies
        // We have 315 and 316. Keep 316.
        // Delete 315.
        console.log("Archiving duplicate ID 315...");
        await db.query("UPDATE questions SET status = 'Archived', is_active = FALSE WHERE id = 315");
        console.log("Archived ID 315.");

        // 3. Ensure 316 is active and correct
        console.log("Verifying ID 316...");
        await db.query("UPDATE questions SET status = 'Published', is_active = TRUE WHERE id = 316");
        console.log("ID 316 Verified.");

        console.log("Cleanup Complete!");

    } catch (error) {
        console.error("ERROR:", error);
    } finally {
        process.exit(0);
    }
}

cleanup();
