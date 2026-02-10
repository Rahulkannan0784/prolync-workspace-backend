import { generateUserId } from './utils/idGenerator.js';
import db from './config/db.js';

async function testGeneration() {
    console.log("Starting ID Generation Test...");
    const ids = [];
    const iterations = 50; // Generate 50 IDs to test randomization and format

    try {
        for (let i = 0; i < iterations; i++) {
            const id = await generateUserId();
            ids.push(id);
            process.stdout.write('.'); // Progress dot
        }
        console.log("\n\nGenerated IDs:");
        console.log(ids);

        // Verification Checks
        console.log("\n--- Verification ---");

        // 1. Check Format
        const formatRegex = /^prln\d{2}[a-z]{2}\d{3}$/;
        const allCorrectFormat = ids.every(id => formatRegex.test(id));
        console.log(`Format Check (prlnYYLLNNN): ${allCorrectFormat ? 'PASSED' : 'FAILED'}`);

        // 2. Check P-Skip
        const pSkipCheck = ids.every(id => {
            const letters = id.substring(6, 8); // prlnYY(LL)NNN
            return !letters.startsWith('p');
        });
        console.log(`P-Series Skip Check: ${pSkipCheck ? 'PASSED' : 'FAILED'}`);

        // 3. Check Randomization (Simple Unique Check)
        const uniqueIds = new Set(ids);
        console.log(`Uniqueness Check (${uniqueIds.size}/${iterations}): ${uniqueIds.size === iterations ? 'PASSED' : 'FAILED'}`);

        // 4. Check Randomization Range
        const hasLow = ids.some(id => parseInt(id.slice(-3)) < 500);
        const hasHigh = ids.some(id => parseInt(id.slice(-3)) >= 500);
        console.log(`Randomization Distribution Check (Has Low & High NNN): ${hasLow && hasHigh ? 'PASSED' : 'ADVISORY (Might just be chance)'}`);


    } catch (error) {
        console.error("Test Failed:", error);
    } finally {
        await db.end();
    }
}

testGeneration();
