import db from './config/db.js';

async function fixTwoSum() {
    try {
        console.log("Starting fix...");

        // 1. Fetch current ID 1 (which SHOULD be "Longest Subarray..." if the user overwrote it)
        const [rows] = await db.query('SELECT * FROM questions WHERE id = 1');
        if (rows.length === 0) {
            console.log("ID 1 not found. Cannot proceed.");
            process.exit(0);
        }
        const currentQ = rows[0];
        console.log("Current ID 1 Title:", currentQ.title);

        if (!currentQ.title.includes("Longest")) {
            console.log("ID 1 does not look like 'Longest Subarray'. It is:", currentQ.title);
            console.log("Aborting to avoid damaging correct data.");
            process.exit(0);
        }

        // 2. Insert "Longest Subarray" as a NEW question
        console.log("Creating NEW question for Longest Subarray...");
        const [res] = await db.query(`
            INSERT INTO questions (title, description, difficulty, topic_id, difficulty_normalized, time_limit, memory_limit, status, constraints, category, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            currentQ.title,
            currentQ.description,
            currentQ.difficulty,
            currentQ.topic_id,
            currentQ.difficulty_normalized,
            currentQ.time_limit,
            currentQ.memory_limit,
            'Published', // Ensure it's published
            currentQ.constraints,
            currentQ.category,
            true
        ]);
        const newId = res.insertId;
        console.log("Created Longest Subarray at ID:", newId);

        // Copy test cases for new ID
        // Fetch test cases for ID 1
        const [tcs] = await db.query('SELECT input, expected_output, is_hidden FROM test_cases WHERE question_id = 1');
        if (tcs.length > 0) {
            const tcValues = tcs.map(tc => [newId, tc.input, tc.expected_output, tc.is_hidden]);
            await db.query(`INSERT INTO test_cases (question_id, input, expected_output, is_hidden) VALUES ?`, [tcValues]);
            console.log(`Copied ${tcs.length} test cases to ID ${newId}`);
        }

        // 3. Restore ID 1 to "Two Sum"
        console.log("Restoring ID 1 to 'Two Sum'...");
        const twoSumDesc = "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.";

        await db.query(`
            UPDATE questions 
            SET title = ?, description = ?, difficulty = 'Easy', difficulty_normalized = 'easy', 
                time_limit = 1, memory_limit = 256, status = 'Published', category = 'DSA',
                constraints = '2 <= nums.length <= 10^4'
            WHERE id = 1
        `, ["Two Sum", twoSumDesc]);

        // Fix Test Cases for ID 1 (Two Sum)
        await db.query('DELETE FROM test_cases WHERE question_id = 1');
        const twoSumCases = [
            [1, "2 7 11 15\n9", "[0, 1]", false],
            [1, "3 2 4\n6", "[1, 2]", false],
            [1, "3 3\n6", "[0, 1]", true]
        ];
        await db.query(`INSERT INTO test_cases (question_id, input, expected_output, is_hidden) VALUES ?`, [twoSumCases]);
        console.log("Restored 'Two Sum' test cases.");

        console.log("Fix Complete!");

    } catch (error) {
        console.error("FIX FAILED:", error);
    } finally {
        process.exit(0);
    }
}

fixTwoSum();
