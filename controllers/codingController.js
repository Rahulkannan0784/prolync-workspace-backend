import db from '../config/db.js';
import badgeService from '../services/badgeService.js';
import axios from 'axios';

// Judge0 Language IDs Mapping
const JUDGE0_LANG_MAP = {
    'python': 71,   // Python (3.8.1)
    'cpp': 54,      // C++ (GCC 9.2.0)
    'java': 62,     // Java (OpenJDK 13.0.1)
    'javascript': 63 // JavaScript (Node.js 12.14.0)
};

// Execute Code via Judge0 (RapidAPI)
export const executeCode = async (req, res) => {
    try {
        const { language, sourceCode, stdin } = req.body;

        const langId = JUDGE0_LANG_MAP[language] || 71; // Default to Python
        const apiKey = process.env.RAPID_API_KEY;
        const apiHost = process.env.RAPID_API_HOST || 'judge0-ce.p.rapidapi.com';

        if (!apiKey) {
            return res.status(500).json({ message: "Judge0 API Key missing in server configuration." });
        }

        console.log('--- Judge0 Request ---');
        console.log('Language:', language, 'ID:', langId);

        try {
            const headers = {
                'Content-Type': 'application/json',
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': apiHost
            };

            // Using wait=true for Run (single case) to keep it simple
            const response = await axios.post(`https://${apiHost}/submissions?base64_encoded=false&wait=true`, {
                language_id: langId,
                source_code: sourceCode,
                stdin: stdin || ""
            }, { headers });

            console.log('Judge0 Success:', response.status);

            // Let's return raw Judge0 for now but wrap it.
            res.json({
                run: {
                    stdout: response.data.stdout,
                    stderr: response.data.stderr,
                    compile_output: response.data.compile_output,
                    output: (response.data.stdout || "") + (response.data.stderr || "") + (response.data.compile_output || ""),
                    message: response.data.message,
                    code: response.data.status?.id === 3 ? 0 : 1, // Status 3 is "Accepted"
                    status: response.data.status,
                    time: response.data.time,
                    memory: response.data.memory
                }
            });
        } catch (error) {
            if (error.response) {
                console.error('Judge0 Error Response:', error.response.status, error.response.data);
                return res.status(error.response.status).json({
                    message: "Judge0 API Error: " + (error.response.data?.message || "Internal Error"),
                    judge0Status: error.response.status,
                    judge0Data: error.response.data
                });
            }
            throw error;
        }
    } catch (error) {
        console.error('Judge0 Proxy Error:', error.message);
        res.status(500).json({ message: "Internal server error during code execution proxy." });
    }
};

// Get User Progress for Streak Calendar
export const getUserProgress = async (req, res) => {
    try {
        const userId = req.user.id; // Assumes auth middleware populates req.user

        // Query: Get count of unique Accepted submissions per day for the last 3 months
        const query = `
            SELECT 
                DATE_FORMAT(DATE_ADD(created_at, INTERVAL 330 MINUTE), '%Y-%m-%d') as date, 
                COUNT(*) as count 
            FROM submissions 
            WHERE 
                user_id = ? 
                AND status = 'Accepted' 
                AND created_at >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
            GROUP BY DATE_FORMAT(DATE_ADD(created_at, INTERVAL 330 MINUTE), '%Y-%m-%d')
            ORDER BY date ASC;
        `;

        const [rows] = await db.query(query, [userId]);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching user progress:', error);
        res.status(500).json({ message: 'Server error fetching progress' });
    }
};

// Submit Solution (Secure Backend Judge)
export const submitSolution = async (req, res) => {
    try {
        const userId = req.user.id;
        const { questionId, code, language, contextType = 'problem', contextId = null } = req.body;

        // 1. Fetch Question & Test Cases
        const [qRows] = await db.query('SELECT time_limit, memory_limit FROM questions WHERE id = ?', [questionId]);
        if (qRows.length === 0) return res.status(404).json({ message: 'Question not found' });

        const [tcRows] = await db.query('SELECT input, expected_output, is_hidden FROM test_cases WHERE question_id = ?', [questionId]);
        if (tcRows.length === 0) return res.status(400).json({ message: 'No test cases found for this question' });

        const langId = JUDGE0_LANG_MAP[language] || 71;
        const apiKey = process.env.RAPID_API_KEY;
        const apiHost = process.env.RAPID_API_HOST || 'judge0-ce.p.rapidapi.com';

        let overallStatus = 'Accepted';
        let firstFailure = null;

        console.log(`--- Secure Submit for User ${userId}, Question ${questionId} ---`);

        // 2. Execute against all test cases
        // Note: For production with many cases, use Batch Submissions. 
        // For simplicity here, we iterate.
        for (let i = 0; i < tcRows.length; i++) {
            const tc = tcRows[i];

            try {
                const response = await axios.post(`https://${apiHost}/submissions?base64_encoded=false&wait=true`, {
                    language_id: langId,
                    source_code: code,
                    stdin: tc.input || "",
                    expected_output: tc.expected_output || "",
                    cpu_time_limit: qRows[0].time_limit || 2,
                    memory_limit: (qRows[0].memory_limit || 256) * 1024
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-RapidAPI-Key': apiKey,
                        'X-RapidAPI-Host': apiHost
                    }
                });

                const status = response.data.status;
                // Status IDs: 3=Accepted, 4=Wrong Answer, 5=TLE, 6=Compilation Error, 7-12=Runtime Errors
                if (status.id !== 3) {
                    overallStatus = status.description; // e.g., "Wrong Answer", "Time Limit Exceeded"
                    firstFailure = {
                        testCaseIndex: i,
                        input: tc.is_hidden ? "[Hidden Case]" : tc.input,
                        expected: tc.is_hidden ? "[Hidden Case]" : tc.expected_output,
                        actual: tc.is_hidden ? "Encrypted Output" : response.data.stdout,
                        error: response.data.stderr || response.data.message || status.description
                    };
                    break; // Stop on first failure
                }
            } catch (err) {
                console.error(`Judge0 Err on TC ${i}:`, err.message);
                overallStatus = 'Internal Error';
                break;
            }
        }

        // 3. Save submission
        const query = `
            INSERT INTO submissions (user_id, question_id, code, language, status, output, context_type, context_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await db.query(query, [
            userId,
            questionId,
            code,
            language,
            overallStatus,
            firstFailure ? JSON.stringify(firstFailure) : "All test cases passed",
            contextType,
            contextId
        ]);


        // --- STREAK LOGIC START ---
        let updatedStreak = 0;
        try {
            // 1. Fetch current streak status
            const [streakRows] = await db.query(`
                SELECT current_streak, max_streak, 
                DATEDIFF(CURDATE(), last_active_date) as days_since_last
                FROM coding_streak 
                WHERE user_id = ?
            `, [userId]);

            let newStreak = 1;
            let newMax = 1;

            if (streakRows.length > 0) {
                const { current_streak, max_streak, days_since_last } = streakRows[0];

                if (days_since_last === 0) {
                    // Already solved today: keep streak same, but ensure it's at least 1
                    newStreak = Math.max(1, current_streak);
                } else if (days_since_last === 1) {
                    // Solved yesterday: increment
                    newStreak = current_streak + 1;
                } else {
                    // Missed a day (or more): reset
                    newStreak = 1;
                }

                // Calculate new Max
                newMax = Math.max(max_streak || 0, newStreak);
            } else {

            }

            updatedStreak = newStreak;

            // 2. Update / Insert
            // 2. Update / Insert
            if (streakRows.length > 0) {
                await db.query(`
                    UPDATE coding_streak 
                    SET current_streak = ?, max_streak = ?, last_active_date = CURDATE()
                    WHERE user_id = ?
                `, [newStreak, newMax, userId]);
            } else {
                await db.query(`
                    INSERT INTO coding_streak (user_id, current_streak, max_streak, last_active_date)
                    VALUES (?, ?, ?, CURDATE())
                `, [userId, newStreak, newMax]);
            }

        } catch (e) {
            console.error("Streak Validated Update Error:", e.message);
        }
        // --- STREAK LOGIC END ---

        // Badge Awarding Logic (Automated)
        try {
            // 1. Fetch current stats
            const [statsRes] = await db.query(`
                SELECT 
                    COUNT(DISTINCT CASE WHEN status = 'Accepted' THEN question_id END) as totalSolved,
                    COUNT(DISTINCT CASE WHEN context_type = 'scenario' THEN context_id END) as scenariosActive,
                    COUNT(DISTINCT CASE WHEN context_type = 'kit' THEN context_id END) as kitsActive
                FROM submissions 
                WHERE user_id = ?
            `, [userId]);

            const { totalSolved, scenariosActive, kitsActive } = statsRes[0];

            // 2. Check Triggers via Service
            await badgeService.checkAndAwardBadges(userId, badgeService.TRIGGERS.PROBLEMS_SOLVED, totalSolved);

            if (scenariosActive > 0) {
                await badgeService.checkAndAwardBadges(userId, badgeService.TRIGGERS.SCENARIOS_SOLVED, scenariosActive);
            }
            if (kitsActive > 0) {
                await badgeService.checkAndAwardBadges(userId, badgeService.TRIGGERS.KITS_COMPLETED, kitsActive);
            }

            // Check for First Problem (Event Based)
            if (totalSolved === 1) {
                await badgeService.checkAndAwardBadges(userId, badgeService.TRIGGERS.FIRST_PROBLEM, 0);
            }

        } catch (badgeErr) {
            console.error("Badge Awarding Error:", badgeErr.message);
        }

        res.status(201).json({
            message: 'Solution processed',
            submissionId: result.insertId,
            status: overallStatus,
            output: firstFailure ? JSON.stringify(firstFailure) : "All test cases passed",
            streak: updatedStreak
        });
    } catch (error) {
        console.error('Error submitting solution:', error);
        res.status(500).json({ message: 'Server error submitting solution' });
    }
};

// ... (Existing exports like getUserProgress, submitSolution)

// --- PUBLIC & USER API ---

// Get All Questions (Public/User: Published only | Admin: All)
export const getQuestions = async (req, res) => {
    try {
        const isAdmin = req.user?.role?.toLowerCase() === 'admin';
        const { topic, difficulty, search, status } = req.query;

        let query = `SELECT id, title, difficulty, topic_id, time_limit, memory_limit, acceptance_rate, status, category, kit_id FROM questions WHERE 1=1`;
        const params = [];

        if (!isAdmin) {
            // Ensure we filter by is_active = TRUE for non-admins
            query += ` AND status = 'Published' AND is_active = TRUE`;
        }

        if (topic && topic !== 'All Problems') {
            // Join topics or just filter by normalized topic (assuming simple string filter requested)
            // Ideally we join, but for now lets rely on frontend passing topic name or id?
            // If topic is text:
            query += ` AND topic_id IN (SELECT id FROM topics WHERE name = ? OR slug = ?)`;
            params.push(topic, topic.toLowerCase());
        }

        if (difficulty && difficulty !== 'All') {
            query += ` AND difficulty = ?`;
            params.push(difficulty);
        }

        if (search) {
            query += ` AND title LIKE ?`;
            params.push(`%${search}%`);
        }

        if (status && status !== 'all') {
            query += ` AND status = ?`;
            params.push(status);
        }

        if (req.query.category && req.query.category !== 'all') {
            query += ` AND category = ?`;
            params.push(req.query.category);
        }

        if (req.query.kit_id && req.query.kit_id !== 'all') {
            if (req.query.kit_id === 'none') {
                query += ` AND kit_id IS NULL`;
            } else {
                query += ` AND kit_id = ?`;
                params.push(req.query.kit_id);
            }
        }

        query += ` ORDER BY id ASC`;

        const [rows] = await db.query(query, params);

        // Enrich with topic name if needed (or join in main query)
        // Let's do a quick fetch of topics to map IDs to names for clean frontend
        const [topics] = await db.query('SELECT id, name FROM topics');
        const topicMap = topics.reduce((acc, t) => ({ ...acc, [t.id]: t.name }), {});

        const questions = rows.map(q => ({
            ...q,
            topic: topicMap[q.topic_id] || 'General'
        }));

        res.json(questions);
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ message: 'Error fetching questions' });
    }
};

// Get Question Detail (Public: No hidden cases | Admin: All)
export const getQuestionById = async (req, res) => {
    try {
        const { id } = req.params;
        const isAdmin = req.user?.role?.toLowerCase() === 'admin';

        const [qRows] = await db.query(`SELECT * FROM questions WHERE id = ?`, [id]);
        if (qRows.length === 0) return res.status(404).json({ message: 'Question not found' });

        const question = qRows[0];

        // Fetch Test Cases
        let tcQuery = `SELECT id, input, expected_output, is_hidden FROM test_cases WHERE question_id = ?`;
        if (!isAdmin) {
            tcQuery += ` AND is_hidden = FALSE`;
        }

        const [tcRows] = await db.query(tcQuery, [id]);

        // Fetch Topic Name
        const [topicRows] = await db.query('SELECT name FROM topics WHERE id = ?', [question.topic_id]);
        const topicName = topicRows[0]?.name || 'General';

        // Format Response
        const response = {
            ...question,
            topic: topicName,
            examples: tcRows.filter(tc => !tc.is_hidden).map(tc => ({
                input: tc.input,
                output: tc.expected_output
            })),
            // User never sees 'hiddenCases' array unless admin?
            hiddenCases: isAdmin ? tcRows.filter(tc => tc.is_hidden) : [],
            constraints: question.constraints ? JSON.parse(question.constraints) : []
        };

        res.json(response);
    } catch (error) {
        console.error('Error fetching question info:', error);
        res.status(500).json({ message: 'Error fetching question info' });
    }
};

// --- ADMIN API ---

// Create Question
export const createQuestion = async (req, res) => {
    try {
        const { title, description, difficulty, topic, time_limit, memory_limit, status, constraints, test_cases, kit_id } = req.body;

        // Verify or Create Topic
        let topicId;
        const [tRows] = await db.query('SELECT id FROM topics WHERE name = ? OR slug = ?', [topic, topic?.toLowerCase()]);

        if (tRows.length > 0) {
            topicId = tRows[0].id;
        } else {
            // Create new topic
            const slug = topic.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
            const [newTopic] = await db.query('INSERT INTO topics (name, slug) VALUES (?, ?)', [topic, slug]);
            topicId = newTopic.insertId;
        }

        // Insert Question
        const [qRes] = await db.query(`
            INSERT INTO questions (title, description, difficulty, topic_id, difficulty_normalized, time_limit, memory_limit, status, constraints, category, kit_id, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
        `, [title, description, difficulty, topicId, difficulty.toLowerCase(), time_limit, memory_limit, status, JSON.stringify(constraints), req.body.category || 'DSA', kit_id || null]);

        const questionId = qRes.insertId;

        // Insert Test Cases
        if (test_cases && test_cases.length > 0) {
            const tcValues = test_cases.map(tc => [questionId, tc.input, tc.output, tc.hidden || false]);
            await db.query(`INSERT INTO test_cases (question_id, input, expected_output, is_hidden) VALUES ?`, [tcValues]);
        }

        res.status(201).json({ message: 'Question created', id: questionId });

    } catch (error) {
        console.error('Error creating question:', error);
        res.status(500).json({ message: 'Error creating question' });
    }
};

// Update Question
export const updateQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, difficulty, topic, time_limit, memory_limit, status, constraints, test_cases, kit_id } = req.body;

        // Verify Topic (if updated)
        let topicId = null;
        if (topic) {
            const [tRows] = await db.query('SELECT id FROM topics WHERE name = ? OR slug = ?', [topic, topic?.toLowerCase()]);
            if (tRows.length > 0) {
                topicId = tRows[0].id;
            } else {
                // Create new topic
                const slug = topic.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
                const [newTopic] = await db.query('INSERT INTO topics (name, slug) VALUES (?, ?)', [topic, slug]);
                topicId = newTopic.insertId;
            }
        }

        // Update Question Fields
        const updates = [];
        const params = [];
        if (title) { updates.push('title = ?'); params.push(title); }
        if (description) { updates.push('description = ?'); params.push(description); }
        if (difficulty) { updates.push('difficulty = ?'); params.push(difficulty); updates.push('difficulty_normalized = ?'); params.push(difficulty.toLowerCase()); }
        if (topicId) { updates.push('topic_id = ?'); params.push(topicId); }
        if (time_limit) { updates.push('time_limit = ?'); params.push(time_limit); }
        if (memory_limit) { updates.push('memory_limit = ?'); params.push(memory_limit); }
        if (status) { updates.push('status = ?'); params.push(status); }
        if (constraints) { updates.push('constraints = ?'); params.push(JSON.stringify(constraints)); }
        if (req.body.category) { updates.push('category = ?'); params.push(req.body.category); }
        if (kit_id !== undefined) { updates.push('kit_id = ?'); params.push(kit_id); }

        if (updates.length > 0) {
            params.push(id);
            await db.query(`UPDATE questions SET ${updates.join(', ')} WHERE id = ?`, params);
        }

        // Update Test Cases (Replace Strategy usually easiest for forms)
        if (test_cases) {
            await db.query('DELETE FROM test_cases WHERE question_id = ?', [id]);
            if (test_cases.length > 0) {
                const tcValues = test_cases.map(tc => [id, tc.input, tc.output, tc.hidden || false]);
                await db.query(`INSERT INTO test_cases (question_id, input, expected_output, is_hidden) VALUES ?`, [tcValues]);
            }
        }

        res.json({ message: 'Question updated successfully' });

    } catch (error) {
        console.error('Error updating question:', error);
        res.status(500).json({ message: 'Error updating question: ' + error.message, error: error.message });
    }
};

// Delete Question (Hard Delete)
export const deleteQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        // Hard delete to remove it completely from lists
        await db.query('DELETE FROM questions WHERE id = ?', [id]);
        res.json({ message: 'Question deleted permanently' });
    } catch (error) {
        console.error('Error deleting question:', error);
        res.status(500).json({ message: 'Error deleting question' });
    }
};

// Import JSON
export const importQuestions = async (req, res) => { // Expects array of questions or single object
    try {
        const data = req.body;
        // If file upload, middleware should parse it to body or req.file content
        // Assuming body contains the JSON object or array

        const items = Array.isArray(data) ? data : (data.questions || [data]);
        let importedCount = 0;
        let skippedCount = 0;
        let errors = [];

        for (const item of items) {
            try {
                if (!item.title || !item.topic || !item.difficulty) {
                    skippedCount++;
                    errors.push({ title: item.title || 'Unknown', error: "Missing required fields (title, topic, difficulty)" });
                    continue;
                }

                // 1. Topic Validation & Creation
                let topicId;
                const [tRows] = await db.query('SELECT id FROM topics WHERE name = ? OR slug = ?', [item.topic, item.topic?.toLowerCase()]);

                if (tRows.length > 0) {
                    topicId = tRows[0].id;
                } else {
                    // Create missing topic
                    const slug = item.topic.toLowerCase().replace(/\s+/g, '-');
                    try {
                        const [newTopic] = await db.query('INSERT INTO topics (name, slug) VALUES (?, ?)', [item.topic, slug]);
                        topicId = newTopic.insertId;
                    } catch (topicErr) {
                        // Handle potential race condition or duplicate slug if name diffs but slug same
                        const [existing] = await db.query('SELECT id FROM topics WHERE slug = ?', [slug]);
                        if (existing.length > 0) topicId = existing[0].id;
                        else throw topicErr;
                    }
                }

                // 2. Insert Question
                const [qRes] = await db.query(`
                    INSERT INTO questions (title, description, difficulty, topic_id, difficulty_normalized, time_limit, memory_limit, status, constraints, category, kit_id, is_active)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
                 `, [
                    item.title,
                    item.description || "",
                    item.difficulty,
                    topicId,
                    (item.difficulty || 'Easy').toLowerCase(),
                    item.time_limit || 1,
                    item.memory_limit || 256,
                    item.status || 'Published',
                    JSON.stringify(item.constraints || []),
                    item.category || 'DSA',
                    item.kit_id || null]
                );

                const qId = qRes.insertId;

                // 3. Insert Test Cases
                if (item.test_cases && item.test_cases.length > 0) {
                    const tcValues = item.test_cases.map(tc => [qId, tc.input, tc.output, tc.hidden || false]);
                    await db.query(`INSERT INTO test_cases (question_id, input, expected_output, is_hidden) VALUES ?`, [tcValues]);
                }
                importedCount++;
            } catch (err) {
                console.error(`Error importing item ${item.title}:`, err);
                skippedCount++;
                errors.push({ title: item.title, error: err.message });
            }
        }

        // Log to Audit (Mock)

        res.json({
            message: `Import processed. Success: ${importedCount}, Failed: ${skippedCount}`,
            importedCount,
            skippedCount,
            errors
        });

    } catch (error) {
        console.error('Import Error:', error);
        res.status(500).json({ message: 'Import failed due to server error' });
    }
};

// Get User Dashboard Stats (Persisted)
export const getUserCodingStats = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Solved Problems & Breakdown
        // Only count ACTIVE Published Questions
        const solvedQuery = `
            SELECT DISTINCT s.question_id
            FROM submissions s
            JOIN questions q ON s.question_id = q.id
            WHERE s.user_id = ? AND s.status = 'Accepted' AND q.is_active = TRUE
        `;
        const [solvedRows] = await db.query(solvedQuery, [userId]);
        const solvedProblemIds = solvedRows.map(r => r.question_id);

        const totalSolved = solvedProblemIds.length;

        // Breakdown (Using Question Difficulty)
        const [diffRows] = await db.query(`
            SELECT q.difficulty, COUNT(DISTINCT s.question_id) as count
            FROM submissions s
            JOIN questions q ON s.question_id = q.id
            WHERE s.user_id = ? AND s.status = 'Accepted' AND q.is_active = TRUE
            GROUP BY q.difficulty
        `, [userId]);

        const breakdown = { Easy: 0, Medium: 0, Hard: 0 };
        diffRows.forEach(r => { if (breakdown[r.difficulty] !== undefined) breakdown[r.difficulty] = r.count; });

        // 2. Streak - Check validity (must be active today or yesterday)
        const [streakRows] = await db.query(`
            SELECT current_streak, 
            DATEDIFF(CURDATE(), last_active_date) as days_since_active
            FROM coding_streak 
            WHERE user_id = ?
        `, [userId]);

        let streak = 0;
        if (streakRows.length > 0) {
            const daysDiff = streakRows[0].days_since_active;
            // Valid if active Today (0) or Yesterday (1)
            if (daysDiff <= 1) {
                streak = streakRows[0].current_streak;
            }
        }

        // 4. Kits & Scenarios
        const [kitRows] = await db.query("SELECT COUNT(DISTINCT context_id) as count FROM submissions WHERE user_id = ? AND context_type = 'kit'", [userId]);
        const [scenarioRows] = await db.query("SELECT COUNT(DISTINCT context_id) as count FROM submissions WHERE user_id = ? AND context_type = 'scenario'", [userId]);

        // 3. Badges (Auto-award based on stats to sync legacy/manual progress)
        try {
            await badgeService.checkAndAwardBadges(userId, badgeService.TRIGGERS.PROBLEMS_SOLVED, totalSolved);

            if (scenarioRows[0].count > 0) {
                await badgeService.checkAndAwardBadges(userId, badgeService.TRIGGERS.SCENARIOS_SOLVED, scenarioRows[0].count);
            }
            if (kitRows[0].count > 0) {
                await badgeService.checkAndAwardBadges(userId, badgeService.TRIGGERS.KITS_COMPLETED, kitRows[0].count);
            }
        } catch (e) {
            console.error("Auto-award badges error", e);
        }

        const [badgeRows] = await db.query('SELECT COUNT(*) as count FROM user_badges WHERE user_id = ?', [userId]);
        const badges = badgeRows[0].count;

        // 5. Languages Used Breakdown
        const [langRows] = await db.query(`
            SELECT language, COUNT(DISTINCT question_id) as count
            FROM submissions
            WHERE user_id = ? AND status = 'Accepted'
            GROUP BY language
        `, [userId]);

        const languagesUsed = {};
        langRows.forEach(row => {
            languagesUsed[row.language] = row.count;
        });

        res.json({
            solvedProblemIds,
            totalSolved,
            streak,
            badges,
            easySolved: breakdown.Easy,
            mediumSolved: breakdown.Medium,
            hardSolved: breakdown.Hard,
            kitsActive: kitRows[0].count,
            scenariosActive: scenarioRows[0].count,
            languagesUsed
        });

    } catch (error) {
        console.error('Error fetching coding stats:', error);
        res.status(500).json({
            solvedProblemIds: [],
            totalSolved: 0,
            streak: 0,
            badges: 0,
            easySolved: 0, mediumSolved: 0, hardSolved: 0
        });
    }
};

// @desc    Get Question Analytics (Admin)
// @route   GET /api/coding/admin/:id/analytics
export const getQuestionAnalytics = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Fetch Question Basic Info
        const [qRows] = await db.query('SELECT title, difficulty, topic_id FROM questions WHERE id = ?', [id]);
        if (qRows.length === 0) return res.status(404).json({ message: 'Question not found' });
        const question = qRows[0];

        // 2. Calculate Stats
        const [statsRows] = await db.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'Accepted' THEN 1 ELSE 0 END) as accepted,
                SUM(CASE WHEN status != 'Accepted' THEN 1 ELSE 0 END) as failed
            FROM submissions 
            WHERE question_id = ?
        `, [id]);

        const stats = {
            total: statsRows[0].total || 0,
            accepted: statsRows[0].accepted || 0,
            failed: statsRows[0].failed || 0,
            successRate: 0
        };

        if (stats.total > 0) {
            stats.successRate = Math.round((stats.accepted / stats.total) * 100);
        }


        // 3. Fetch Recent Submissions
        const [subs] = await db.query(`
            SELECT 
                s.id, s.language, s.status, s.created_at, 
                s.execution_time as runtime_ms, 
                NULL as memory_kb,
                u.name as student_name, u.email as student_email
            FROM submissions s
            JOIN users u ON s.user_id = u.id
            WHERE s.question_id = ?
            ORDER BY s.created_at DESC
            LIMIT 100
        `, [id]);

        res.json({
            question,
            stats,
            submissions: subs
        });

    } catch (error) {
        console.error('Error fetching question analytics:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get Platform Analytics (Admin)
// @route   GET /api/coding/admin/analytics/platform
export const getPlatformAnalytics = async (req, res) => {
    try {
        const { range = 'all', difficulty = 'All', language = 'All', type = 'all' } = req.query;

        // --- 1. Dynamic Filter Construction ---
        const filters = [];
        const params = [];

        // Time Filter
        if (range === 'today') filters.push('s.created_at >= CURDATE()');
        else if (range === 'week') filters.push('s.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)');
        else if (range === 'month') filters.push('s.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)');

        // Language Filter
        if (language && language !== 'All') {
            filters.push('s.language = ?');
            params.push(language);
        }

        // Context (Type) Filter
        if (type && type !== 'all') {
            if (type === 'problem') {
                filters.push("(s.context_type = 'problem' OR s.context_type IS NULL)");
            } else {
                filters.push('s.context_type = ?');
                params.push(type);
            }
        }

        // Difficulty Filter (Separated because charts like 'difficultyStats' ignore it)
        const difficultyClause = (difficulty && difficulty !== 'All') ? 'q.difficulty = ?' : null;

        // Construct Final "Where" and "Params" for general usage
        const baseWhere = filters.length > 0 ? filters.join(' AND ') : '1=1';
        const baseParams = [...params];

        const fullWhere = difficultyClause ? `${baseWhere} AND ${difficultyClause}` : baseWhere;
        const fullParams = difficultyClause ? [...baseParams, difficulty] : baseParams;

        // --- 2. Overview Stats ---
        // Total Questions (Respects context and difficulty)
        let qWhere = 'is_active = TRUE';
        const qParams = [];
        if (difficulty && difficulty !== 'All') {
            qWhere += ' AND difficulty = ?';
            qParams.push(difficulty);
        }
        if (type && type !== 'all') {
            if (type === 'problem') qWhere += " AND category = 'DSA'";
            else if (type === 'scenario') qWhere += " AND category = 'Scenario'";
            else if (type === 'kit') qWhere += " AND kit_id IS NOT NULL";
        }
        const [qCountRow] = await db.query(`SELECT COUNT(*) as count FROM questions WHERE ${qWhere}`, qParams);

        // Submission Stats
        const [subStats] = await db.query(`
            SELECT 
                COUNT(*) as totalSubmissions,
                COUNT(DISTINCT s.user_id) as activeUsers,
                SUM(CASE WHEN s.status = 'Accepted' THEN 1 ELSE 0 END) as acceptedSubmissions
            FROM submissions s
            JOIN questions q ON s.question_id = q.id
            WHERE ${fullWhere}
        `, fullParams);

        const statsRow = subStats[0];

        // --- 3. Trends (Gap-filled) ---
        let daysToFetch = 30;
        if (range === 'week') daysToFetch = 7;
        else if (range === 'today') daysToFetch = 1;

        const [trendRows] = await db.query(`
            SELECT 
                DATE_FORMAT(s.created_at, '%Y-%m-%d') as date,
                COUNT(*) as submissions,
                SUM(CASE WHEN s.status = 'Accepted' THEN 1 ELSE 0 END) as accepted
            FROM submissions s
            JOIN questions q ON s.question_id = q.id
            WHERE ${fullWhere}
            GROUP BY date
            ORDER BY date DESC
            LIMIT ?
        `, [...fullParams, daysToFetch]);

        const fillGaps = (rows, days) => {
            const dataMap = new Map(rows.map(r => [r.date, r]));
            const results = [];
            const today = new Date();
            for (let i = days - 1; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                const existing = dataMap.get(dateStr);
                results.push({
                    date: dateStr,
                    submissions: existing ? existing.submissions : 0,
                    accepted: existing ? Number(existing.accepted || 0) : 0
                });
            }
            return results;
        };

        // --- 4. Breakdowns & Rankings ---
        // Language Breakdown
        const [languages] = await db.query(`
            SELECT s.language, COUNT(*) as count
            FROM submissions s
            JOIN questions q ON s.question_id = q.id
            WHERE ${fullWhere}
            GROUP BY s.language
            ORDER BY count DESC
        `, fullParams);

        // Difficulty Breakdown (Always shows COMPARISON, uses baseParams to respect context/lang but NOT difficulty)
        const [diffStats] = await db.query(`
            SELECT 
                q.difficulty,
                COUNT(*) as total,
                SUM(CASE WHEN s.status = 'Accepted' THEN 1 ELSE 0 END) as accepted
            FROM submissions s
            JOIN questions q ON s.question_id = q.id
            WHERE ${baseWhere}
            GROUP BY q.difficulty
        `, baseParams);

        // Top Users
        const [topUsers] = await db.query(`
            SELECT 
                u.name, u.email, 
                COUNT(DISTINCT s.question_id) as solved_count,
                COUNT(*) as total_submissions,
                ROUND((SUM(CASE WHEN s.status = 'Accepted' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 1) as acceptance_rate
            FROM submissions s
            JOIN users u ON s.user_id = u.id
            JOIN questions q ON s.question_id = q.id
            WHERE s.status = 'Accepted' AND ${fullWhere}
            GROUP BY s.user_id, u.name, u.email
            ORDER BY solved_count DESC
            LIMIT 5
        `, fullParams);

        // Most Active Questions
        const [problemStats] = await db.query(`
            SELECT 
                q.title, q.difficulty,
                COUNT(*) as attempts,
                SUM(CASE WHEN s.status = 'Accepted' THEN 1 ELSE 0 END) as accepted_count,
                ROUND((SUM(CASE WHEN s.status = 'Accepted' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 1) as acceptance_rate
            FROM submissions s
            JOIN questions q ON s.question_id = q.id
            WHERE ${fullWhere}
            GROUP BY q.id, q.title, q.difficulty
            ORDER BY attempts DESC
            LIMIT 10
        `, fullParams);

        res.json({
            overview: {
                totalQuestions: qCountRow[0].count,
                totalSubmissions: statsRow.totalSubmissions || 0,
                acceptedSubmissions: statsRow.acceptedSubmissions || 0,
                activeUsers: statsRow.activeUsers || 0,
                successRate: Math.round((statsRow.acceptedSubmissions / (statsRow.totalSubmissions || 1)) * 100) || 0
            },
            trends: fillGaps(trendRows, daysToFetch),
            languages,
            difficultyStats: diffStats,
            topUsers,
            problemStats
        });

    } catch (error) {
        console.error('Error fetching platform analytics:', error);
        res.status(500).json({ message: 'Server error fetching analytics' });
    }
};

// @desc    Get All Topics
// @route   GET /api/coding/topics
export const getTopics = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, name FROM topics ORDER BY name ASC');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching topics:', error);
        res.status(500).json({ message: 'Error fetching topics' });
    }
};

// Get All Kits
export const getKits = async (req, res) => {
    try {
        const query = `
            SELECT k.*, 
            (SELECT COUNT(*) FROM questions q WHERE q.kit_id = k.id) as problem_count
            FROM coding_kits k
            ORDER BY k.created_at DESC
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        console.error("Error fetching kits:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Create a Kit
export const createKit = async (req, res) => {
    try {
        const { title, description, difficulty, color, icon } = req.body;

        const query = 'INSERT INTO coding_kits (title, description, difficulty, color, icon) VALUES (?, ?, ?, ?, ?)';
        const [result] = await db.query(query, [title, description, difficulty || 'Mixed', color || 'blue', icon || 'Box']);

        res.status(201).json({ message: "Kit created successfully", id: result.insertId });
    } catch (error) {
        console.error("Error creating kit:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Update a Kit
export const updateKit = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, difficulty, color, icon } = req.body;

        const query = 'UPDATE coding_kits SET title = ?, description = ?, difficulty = ?, color = ?, icon = ? WHERE id = ?';
        await db.query(query, [title, description, difficulty || 'Mixed', color || 'blue', icon || 'Box', id]);

        res.json({ message: "Kit updated successfully" });
    } catch (error) {
        console.error("Error updating kit:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Delete a Kit
export const deleteKit = async (req, res) => {
    try {
        const { id } = req.params;

        // First, set kit_id to NULL for all questions in this kit
        await db.query('UPDATE questions SET kit_id = NULL WHERE kit_id = ?', [id]);

        // Then delete the kit
        await db.query('DELETE FROM coding_kits WHERE id = ?', [id]);

        res.json({ message: "Kit deleted successfully" });
    } catch (error) {
        console.error("Error deleting kit:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Get Problem of the Day (Cycling through all questions)
// @route   GET /api/coding/daily-challenge
export const getDailyChallenge = async (req, res) => {
    try {
        // 1. Get total count of Published & Published questions
        const [countRow] = await db.query(`
            SELECT COUNT(*) as total 
            FROM questions 
            WHERE status = 'Published' AND is_active = TRUE
        `);

        const N = countRow[0].total;
        if (N === 0) return res.status(404).json({ message: "No published questions available" });

        // 2. Calculate Days since a fixed date (Epoch: 2024-01-01)
        const epoch = new Date('2024-01-01');
        const today = new Date();
        const diffInMs = today - epoch;
        const D = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        // 3. Cycling Logic: Index = Days % Total
        const targetOffset = D % N;

        // 4. Fetch the question at that offset
        // Selection is stable because we order by ID
        const [qRows] = await db.query(`
            SELECT id, title, difficulty, topic_id, description, time_limit, memory_limit, acceptance_rate, category
            FROM questions 
            WHERE status = 'Published' AND is_active = TRUE
            ORDER BY id ASC
            LIMIT 1 OFFSET ?
        `, [targetOffset]);

        if (qRows.length === 0) return res.status(404).json({ message: "Problem of the day not found" });

        // Enrich with topic name
        const [topicRows] = await db.query('SELECT name FROM topics WHERE id = ?', [qRows[0].topic_id]);

        res.json({
            ...qRows[0],
            topic: topicRows[0]?.name || 'General'
        });

    } catch (error) {
        console.error('Error fetching daily challenge:', error);
        res.status(500).json({ message: 'Error fetching daily challenge' });
    }
};
