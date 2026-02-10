import db from '../config/db.js';

export const generateUserId = async () => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Get Current Year (last 2 digits)
        const currentYear = new Date().getFullYear() % 100;
        const prefix = 'prln';

        // 2. Fetch current letter sequence for this year
        // FOR UPDATE to lock the row and prevent concurrent race conditions
        const [rows] = await connection.query(
            'SELECT last_letter_sequence FROM id_sequences WHERE year = ? FOR UPDATE',
            [currentYear]
        );

        let letterSequence = 'aa';

        if (rows.length === 0) {
            // Initialize if new year
            await connection.query(
                'INSERT INTO id_sequences (year, last_letter_sequence) VALUES (?, ?)',
                [currentYear, 'aa']
            );
        } else {
            letterSequence = rows[0].last_letter_sequence;
        }

        // 3. Generate Random Number (001 - 999)
        // We try a random number first. If it clashes, we might fail or retry.
        // But the requirement says: "once all 999 values are exhausted, move to the next valid letter pair"

        // OPTIMIZED STRATEGY:
        // Instead of strict sequential filling (which is predictable), we want random NNN.
        // We will loop a few times to find a free NNN slot for the Current LL.
        // If we fail too many times (implying density is high), we increment LL and try again.

        let attempts = 0;
        let generatedId = null;
        let finalLetterSequence = letterSequence;

        while (!generatedId && attempts < 50) { // Safety break

            // Try to find a random slot in the current letter sequence
            const randomNum = Math.floor(Math.random() * 999) + 1;
            const numericPart = randomNum.toString().padStart(3, '0');
            const candidateId = `${prefix}${currentYear}${finalLetterSequence}${numericPart}`;

            // Check if this ID exists in users table
            // Note: We use the connection from the pool (not the transaction lock) for this check? 
            // Actually, we should check within transaction context to be safe.
            const [existing] = await connection.query(
                'SELECT 1 FROM users WHERE custom_id = ?',
                [candidateId]
            );

            if (existing.length === 0) {
                generatedId = candidateId;
            } else {
                // Collision!
                // If we get too many collisions, maybe it's time to increment the letter sequence.
                // For simplicity/robustness, let's say after 5 collisions in the SAME letter pair, we move to next.
                if (attempts > 0 && attempts % 5 === 0) {
                    finalLetterSequence = incrementLetterSequence(finalLetterSequence);

                    // Update the sequence in DB so other processes know we moved on
                    await connection.query(
                        'UPDATE id_sequences SET last_letter_sequence = ? WHERE year = ?',
                        [finalLetterSequence, currentYear]
                    );
                }
                attempts++;
            }
        }

        if (!generatedId) {
            throw new Error("Failed to generate unique User ID after multiple attempts.");
        }

        // Commit transaction
        await connection.commit();
        return generatedId;

    } catch (error) {
        await connection.rollback();
        console.error("ID Generation Error:", error);
        throw error;
    } finally {
        connection.release();
    }
};

// Helper to increment 'aa' -> 'ab' -> ... -> 'az' -> 'ba' ...
// AND SKIP 'p*'
const incrementLetterSequence = (seq) => {
    let first = seq.charCodeAt(0);
    let second = seq.charCodeAt(1);

    second++; // Increment second char

    if (second > 'z'.charCodeAt(0)) {
        second = 'a'.charCodeAt(0);
        first++; // Increment first char

        if (first > 'z'.charCodeAt(0)) {
            // Overflow (zz -> ???) - Cycle back or extend? 
            // Requirement doesn't specify what happens after zz. Resetting to aa is dangerous.
            // Let's assume we won't hit this limit easily.
            throw new Error("User ID capacity reached (zz999).");
        }
    }

    let newSeq = String.fromCharCode(first) + String.fromCharCode(second);

    // SKIP P-SERIES RULE
    // If we just entered 'pa', skip all the way to 'qa'
    if (newSeq.startsWith('p')) {
        newSeq = 'qa';
    }

    return newSeq;
};
