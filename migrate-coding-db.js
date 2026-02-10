
import db from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const runMigration = async () => {
    console.log("Starting Coding DB Migration...");

    try {
        // 1. Create Topics Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS topics (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                slug VARCHAR(100) NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("✅ Topics table ready");


        // 2. Add Columns to Questions Table (One by one, ignoring errors if exist)
        const cols = [
            "ADD COLUMN topic_id INT",
            "ADD COLUMN time_limit INT DEFAULT 1",
            "ADD COLUMN memory_limit INT DEFAULT 256",
            "ADD COLUMN status ENUM('Draft', 'Published', 'Archived') DEFAULT 'Draft'",
            "ADD COLUMN constraints TEXT",
            "ADD COLUMN acceptance_rate FLOAT DEFAULT 0",
            "ADD COLUMN is_active BOOLEAN DEFAULT TRUE",
            "ADD COLUMN difficulty_normalized VARCHAR(20) DEFAULT 'easy'",
            "ADD COLUMN category VARCHAR(50) DEFAULT 'DSA'"
        ];

        for (const col of cols) {
            try {
                await db.query(`ALTER TABLE questions ${col}`);
            } catch (e) {
                // Ignore duplicate column errors
                if (!e.message.includes("Duplicate column") && !e.message.includes("check that column/key exists")) {
                    console.log(`Alter warning for ${col}:`, e.message);
                }
            }
        }
        console.log("✅ Questions table schema updated");

        // 3. Ensure Test Cases has is_hidden
        try {
            await db.query(`ALTER TABLE test_cases ADD COLUMN is_hidden BOOLEAN DEFAULT FALSE`);
        } catch (e) { }
        console.log("✅ Test Cases table schema updated");

        // 4. Create Audit Logs
        await db.query(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                admin_id INT,
                action VARCHAR(255) NOT NULL,
                details JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 5. Seed Static Data
        const topics = [
            "Arrays", "Linked List", "Hash Table", "Math", "Strings",
            "Two Pointers", "Stack", "Binary Search", "Dynamic Programming",
            "Backtracking", "Trees", "Heap", "Graphs"
        ];

        // Topic ID Map
        const topicMap = {};

        for (const t of topics) {
            const slug = t.toLowerCase().replace(/ /g, '-');
            await db.query(`INSERT IGNORE INTO topics (name, slug) VALUES (?, ?)`, [t, slug]);
            const [rows] = await db.query(`SELECT id FROM topics WHERE slug = ?`, [slug]);
            if (rows.length) topicMap[t] = rows[0].id;
        }
        console.log("✅ Topics seeded");

        // Problems Data (Extracted from codingData.ts)
        // Problems Data (Full set from codingData.ts)
        const PROBLEMS = [
            // --- Kit 1: Arrays (201-210) ---
            {
                id: 201, title: "Zig-Zag Forming Without Sorting", difficulty: "Easy", topic: "Arrays",
                description: "You are given an array A of size N. Rearrange the array such that it follows the pattern A[0] < A[1] > A[2] < A[3] > A[4] … You are not allowed to sort the entire array. You may only swap adjacent elements when the condition is violated. Return the modified array.",
                examples: [{ input: "7\n4 3 7 8 6 2 1", output: "3 7 4 8 2 6 1" }],
                hiddenCases: [{ input: "6\n9 9 9 9 9 9", output: "9 9 9 9 9 9" }, { input: "5\n-3 -1 -2 -4 -5", output: "-3 -1 -2 -4 -5" }],
                constraints: ["1 ≤ N ≤ 10^5", "-10^9 ≤ A[i] ≤ 10^9", "Must run in O(N)", "Adjacent-only swaps allowed"]
            },
            {
                id: 202, title: "Longest Subarray With Equal Evens and Odds", difficulty: "Medium", topic: "Arrays",
                description: "Find the maximum length of a contiguous subarray where the count of even numbers equals the count of odd numbers.",
                examples: [{ input: "6\n2 3 4 5 6 7", output: "6" }],
                hiddenCases: [{ input: "8\n1 1 1 2 2 2 2 1", output: "6" }, { input: "5\n2 4 6 8 10", output: "0" }],
                constraints: ["1 ≤ N ≤ 2 × 10^5", "−10^9 ≤ A[i] ≤ 10^9", "Expected Time: O(N)", "Space ≤ O(N)"]
            },
            {
                id: 203, title: "Minimum Rotations to Make Array Strictly Increasing", difficulty: "Hard", topic: "Arrays",
                description: "You may rotate the array any number of times. Determine minimum rotations required to make the array strictly increasing. If no rotation results in a strictly increasing array, print -1. Rotation means last element moves to front.",
                examples: [{ input: "5\n3 4 5 1 2", output: "3" }],
                hiddenCases: [{ input: "6\n1 2 2 3 4 5", output: "-1" }, { input: "4\n4 3 2 1", output: "-1" }],
                constraints: ["1 ≤ N ≤ 2×10^5", "Strictly increasing ⇒ A[i] < A[i+1]", "No duplicates allowed after rotation", "Time: O(N)"]
            },
            {
                id: 204, title: "Count Mountain Triplets", difficulty: "Medium", topic: "Arrays",
                description: "Count triplets (i < j < k) such that A[i] < A[j] > A[k]",
                examples: [{ input: "5\n1 4 2 3 1", output: "2" }],
                hiddenCases: [{ input: "6\n5 4 3 2 1 0", output: "0" }, { input: "7\n1 2 3 4 5 6 7", output: "0" }],
                constraints: ["1 ≤ N ≤ 2×10^5", "−10^9 ≤ A[i] ≤ 10^9", "Time: O(N log N) or better", "No brute force O(N³) solutions"]
            },
            {
                id: 205, title: "Split Array Into K Equal-Sum Subarrays", difficulty: "Medium", topic: "Arrays",
                description: "Check whether the array can be partitioned into exactly K contiguous subarrays, all having the same sum.",
                examples: [{ input: "6 3\n3 3 3 3 3 3", output: "YES" }],
                hiddenCases: [{ input: "5 2\n1 2 3 4 5", output: "NO" }, { input: "4 4\n1 1 1 1", output: "YES" }],
                constraints: ["1 ≤ N ≤ 10^5", "1 ≤ K ≤ N", "Time: O(N)", "If total sum % K ≠ 0 ⇒ automatically NO"]
            },
            {
                id: 206, title: "Elements Greater Than All Elements to the Right", difficulty: "Easy", topic: "Arrays",
                description: "Print all elements that are strictly greater than every element to their right. Output order must match original order.",
                examples: [{ input: "6\n10 4 6 3 5 2", output: "10 6 5 2" }],
                hiddenCases: [{ input: "4\n1 2 3 4", output: "4" }, { input: "5\n9 7 5 3 1", output: "9 7 5 3 1" }],
                constraints: ["1 ≤ N ≤ 10^5", "Time: O(N)", "Space: O(1) allowed"]
            },
            {
                id: 207, title: "Maximum XOR Pair in Range Queries", difficulty: "Hard", topic: "Arrays",
                description: "Given array and Q queries [L,R], for each query find the maximum XOR of any two elements inside that subarray.",
                examples: [{ input: "5 1\n1 2 3 4 5\n1 5", output: "7" }],
                hiddenCases: [{ input: "8 2\n5 5 5 5 5 5 5 5\n2 7\n1 8", output: "0\n0" }],
                constraints: ["1 ≤ N,Q ≤ 10^5", "0 ≤ A[i] ≤ 10^9", "Expected Time: O((N+Q) log C)"]
            },
            {
                id: 208, title: "Run-Length Compression of Array", difficulty: "Easy", topic: "Strings",
                description: "Convert array into (value,count) pairs representing consecutive runs.",
                examples: [{ input: "7\n2 2 2 3 3 1 1", output: "(2,3) (3,2) (1,2)" }],
                hiddenCases: [{ input: "1\n9", output: "(9,1)" }, { input: "6\n4 4 4 4 4 4", output: "(4,6)" }],
                constraints: ["1 ≤ N ≤ 10^5", "Output should not merge non-adjacent occurrences."]
            },
            {
                id: 209, title: "Rearrange to Avoid Adjacent Duplicates", difficulty: "Medium", topic: "Heap",
                description: "Rearrange the elements so that no two adjacent elements are equal. If impossible, print -1.",
                examples: [{ input: "6\n1 1 2 2 3 3", output: "1 2 1 2 3 3" }],
                hiddenCases: [{ input: "5\n7 7 7 7 7", output: "-1" }, { input: "4\n1 2 3 4", output: "1 2 3 4" }],
                constraints: ["1 ≤ N ≤ 10^5", "Duplicates allowed", "Time: O(N log N) (heap allowed)"]
            },
            {
                id: 210, title: "Smallest Subarray to Sort to Make Full Array Sorted", difficulty: "Medium", topic: "Arrays",
                description: "Find the smallest continuous subarray which, if sorted, makes the entire array sorted. Return its length.",
                examples: [{ input: "7\n1 2 6 5 4 7 8", output: "3" }],
                hiddenCases: [{ input: "5\n1 2 3 4 5", output: "0" }, { input: "6\n9 8 7 6 5 4", output: "6" }],
                constraints: ["1 ≤ N ≤ 2×10^5", "−10^9 ≤ A[i] ≤ 10^9", "Time: O(N)"]
            },

            // --- Kit 2: DSA (301-310) ---
            {
                id: 301, title: "Reconstruct Binary Tree from Parent References", difficulty: "Medium", topic: "Trees",
                description: "You are given two arrays: P[] — parent of each node, and W[] — value of each node. Verify that this structure forms a valid tree, and if valid, print the sum of values in each subtree.",
                examples: [{ input: "5\n-1 0 0 1 1\n2 3 4 5 6", output: "20 14 4 5 6" }],
                hiddenCases: [{ input: "4\n-1 0 1 2\n1 1 1 1", output: "4 3 2 1" }, { input: "4\n-1 0 0 0\n5 6 7 8", output: "26 6 7 8" }],
                constraints: ["1 ≤ N ≤ 2×10^5", "Time: O(N)"]
            },
            {
                id: 302, title: "Count Connected Components in an Undirected Graph", difficulty: "Easy", topic: "Graphs",
                description: "Given an undirected graph, count how many connected components exist.",
                examples: [{ input: "5 3\n0 1\n1 2\n3 4", output: "2" }],
                hiddenCases: [{ input: "3 0", output: "3" }, { input: "4 3\n0 1\n1 2\n2 3", output: "1" }],
                constraints: ["Time: O(V + E)"]
            },
            {
                id: 303, title: "Height of a Binary Tree from Edges", difficulty: "Easy", topic: "Trees",
                description: "Find the height of the tree (maximum number of nodes on any root-to-leaf path).",
                examples: [{ input: "5\n1 2\n1 3\n2 4\n4 5", output: "4" }],
                hiddenCases: [{ input: "1", output: "1" }, { input: "6\n1 2\n2 3\n3 4\n4 5\n5 6", output: "6" }],
                constraints: ["Time: O(N)"]
            },
            {
                id: 304, title: "Topological Order of a DAG", difficulty: "Medium", topic: "Graphs",
                description: "Given a directed acyclic graph, print any valid topological ordering. If the graph contains a cycle, print -1.",
                examples: [{ input: "4 3\n0 1\n1 2\n0 3", output: "0 1 3 2" }],
                hiddenCases: [{ input: "3 3\n0 1\n1 2\n2 0", output: "-1" }, { input: "5 0", output: "0 1 2 3 4" }],
                constraints: ["Time: O(V + E)"]
            },
            {
                id: 305, title: "Lowest Common Ancestor in Tree", difficulty: "Medium", topic: "Trees",
                description: "Find LCA of two nodes u and v in a tree.",
                examples: [{ input: "5 2\n1 2\n1 3\n2 4\n2 5\n4 5\n3 4", output: "2\n1" }],
                hiddenCases: [{ input: "3 1\n1 2\n1 3\n2 3", output: "1" }],
                constraints: ["Time: O((N + Q) log N)"]
            },
            {
                id: 306, title: "Maximum Sum Increasing Subsequence", difficulty: "Medium", topic: "Dynamic Programming",
                description: "Find the maximum possible sum of an increasing subsequence in the array.",
                examples: [{ input: "6\n1 101 2 3 100 4", output: "106" }],
                hiddenCases: [{ input: "5\n5 4 3 2 1", output: "5" }, { input: "5\n1 2 3 4 5", output: "15" }],
                constraints: ["Time: O(N log N) required"]
            },
            {
                id: 307, title: "Longest Path in a Tree (Tree Diameter)", difficulty: "Hard", topic: "Trees",
                description: "Find the length of the longest path between any two nodes.",
                examples: [{ input: "5\n1 2\n2 3\n3 4\n2 5", output: "3" }],
                hiddenCases: [{ input: "2\n1 2", output: "1" }, { input: "6\n1 2\n2 3\n3 4\n4 5\n5 6", output: "5" }],
                constraints: ["Time: O(N)"]
            },
            {
                id: 308, title: "Minimum Number of Edges to Make Graph Connected", difficulty: "Medium", topic: "Graphs",
                description: "Determine minimum extra edges required to make graph fully connected.",
                examples: [{ input: "5 2\n0 1\n2 3", output: "2" }],
                hiddenCases: [{ input: "4 3\n0 1\n1 2\n2 3", output: "0" }],
                constraints: ["Time: O(V α(V))"]
            },
            {
                id: 309, title: "Count Paths of Length Exactly K in Tree", difficulty: "Hard", topic: "Trees",
                description: "Count unordered node pairs (u,v) with distance K.",
                examples: [{ input: "5 2\n1 2\n2 3\n3 4\n2 5", output: "3" }],
                hiddenCases: [{ input: "4 1\n1 2\n2 3\n3 4", output: "3" }],
                constraints: ["Expected Time: O(N log N)"]
            },
            {
                id: 310, title: "Shortest Cycle in an Undirected Graph", difficulty: "Hard", topic: "Graphs",
                description: "Find the length of the shortest cycle. If none, print -1.",
                examples: [{ input: "4 4\n0 1\n1 2\n2 0\n2 3", output: "3" }],
                hiddenCases: [{ input: "3 2\n0 1\n1 2", output: "-1" }],
                constraints: ["Expected Time: O(V * AvgDeg)"]
            },

            // --- Scenarios (101-113) ---
            {
                id: 101, title: "Bigg Boss Elimination", difficulty: "Medium", topic: "Hash Table",
                description: "Given a list of contestant names and a list of votes, determine who gets eliminated (least votes).",
                examples: [{ input: "contestants = ['A', 'B', 'C'], votes = ['A', 'A', 'B', 'C', 'C']", output: "'B'", explanation: "B has 1 vote." }],
                hiddenCases: [{ input: "['X', 'Y'], ['X']", output: "'Y'" }],
                constraints: ["1 <= contestants <= 15"]
            },
            {
                id: 102, title: "Smart Traffic Light", difficulty: "Hard", topic: "Heap",
                description: "Maximize flow by assigning green light duration based on vehicle density.",
                examples: [{ input: "density = [10, 50, 20, 10]", output: "[15, 60, 30, 15]" }],
                hiddenCases: [{ input: "[0,0,0,0]", output: "[10,10,10,10]" }],
                constraints: ["0 <= density <= 100"]
            },
            {
                id: 103, title: "Seat Allocation", difficulty: "Easy", topic: "Arrays",
                description: "Find the first row where 'k' contiguous seats are available.",
                examples: [{ input: "rows=5, cols=10, request=3", output: "true" }],
                hiddenCases: [{ input: "1, 5, 6", output: "false" }],
                constraints: ["1 <= rows, cols <= 20"]
            },
            {
                id: 104, title: "Shortest Delivery Path", difficulty: "Hard", topic: "Graphs",
                description: "Find shortest route visiting all delivery points.",
                examples: [{ input: "dist=[[0,5,10],[5,0,15],[10,15,0]]", output: "15" }],
                hiddenCases: [{ input: "[[0,1],[1,0]]", output: "1" }],
                constraints: ["N <= 10"]
            },
            {
                id: 105, title: "Trending Movies", difficulty: "Medium", topic: "Hash Table",
                description: "Calculate trending score and return top ranked movie IDs.",
                examples: [{ input: "views=[100,200], days=[2,10]", output: "[2, 1]" }],
                hiddenCases: [{ input: "views=[50,50], days=[1,5]", output: "[1, 2]" }],
                constraints: ["N <= 1000"]
            },
            {
                id: 106, title: "Auction Budget", difficulty: "Medium", topic: "Greedy",
                description: "Buy at least 5 players with maximum rating within budget.",
                examples: [{ input: "budget=10, ratings=[5,4,3], costs=[6,4,2]", output: "7" }],
                hiddenCases: [{ input: "budget=5, ratings=[10], costs=[6]", output: "0" }],
                constraints: ["budget <= 100"]
            },
            {
                id: 107, title: "Message Cipher", difficulty: "Easy", topic: "Strings",
                description: "Encode a string by shifting characters by 'k' positions.",
                examples: [{ input: "msg='abc', k=1", output: "'bcd'" }],
                hiddenCases: [{ input: "'xyz', 1", output: "'yza'" }],
                constraints: ["len <= 1000"]
            },
            {
                id: 108, title: "Order Priority", difficulty: "Easy", topic: "Queue",
                description: "Return order IDs in processing sequence (VIP first).",
                examples: [{ input: "orders=[(1,VIP),(2,Reg)]", output: "[1, 2]" }],
                hiddenCases: [{ input: "[(1,Reg),(2,Reg)]", output: "[1, 2]" }],
                constraints: ["orders <= 500"]
            },
            {
                id: 109, title: "Feed Ranker", difficulty: "Hard", topic: "Heap",
                description: "Return post IDs in descending order of calculated score.",
                examples: [{ input: "posts=[(P1,0.9),(P2,0.8)]", output: "[P1, P2]" }],
                hiddenCases: [{ input: "[(P1,0.5),(P2,0.5)]", output: "[P1, P2]" }],
                constraints: ["posts <= 10000"]
            },
            {
                id: 110, title: "Stock Alert", difficulty: "Medium", topic: "Arrays",
                description: "Return IDs of items that need replenishment.",
                examples: [{ input: "stock=[5, 12, 3], threshold=10", output: "[0, 2]" }],
                hiddenCases: [{ input: "stock=[10,10], threshold=10", output: "[]" }],
                constraints: ["items <= 5000"]
            },
            {
                id: 111, title: "Surge Calculator", difficulty: "Medium", topic: "Math",
                description: "Calculate final fare for a given trip based on surge.",
                examples: [{ input: "base=100, demand=50, supply=10", output: "250" }],
                hiddenCases: [{ input: "100, 10, 50", output: "100" }],
                constraints: ["base >= 50"]
            },
            {
                id: 112, title: "Best Coupon", difficulty: "Easy", topic: "Strings",
                description: "Return the coupon code or ID with max discount.",
                examples: [{ input: "cart=1000, coupons=[(A,10%),(B,50off)]", output: "'A'" }],
                hiddenCases: [{ input: "50, [(A,10%)]", output: "'A'" }],
                constraints: ["cart > 0"]
            },
            {
                id: 113, title: "Playlist Shuffle", difficulty: "Easy", topic: "Arrays",
                description: "Return a randomized array of video IDs.",
                examples: [{ input: "ids=[1,2,3]", output: "[2,1,3]" }],
                hiddenCases: [{ input: "[1]", output: "[1]" }],
                constraints: ["len <= 100"]
            },
        ];

        // Seed Problems
        for (const p of PROBLEMS) {
            // Check if exists
            const [exists] = await db.query('SELECT id FROM questions WHERE id = ?', [p.id]);
            if (exists.length > 0) continue; // Skip if seeded

            // Insert Question
            const tId = topicMap[p.topic] || null;
            await db.query(`
                INSERT INTO questions (id, title, description, difficulty, topic_id, difficulty_normalized, status, constraints)
                VALUES (?, ?, ?, ?, ?, ?, 'Published', ?)
            `, [
                p.id,
                p.title,
                p.description,
                p.difficulty,
                tId,
                p.difficulty.toLowerCase(),
                JSON.stringify(p.constraints)
            ]);

            // Insert Test Cases (Examples + Hidden)
            // Examples -> Public
            // Hidden -> Hidden
            for (const ex of p.examples) {
                await db.query(`INSERT INTO test_cases (question_id, input, expected_output, is_hidden) VALUES (?, ?, ?, FALSE)`, [p.id, ex.input, ex.output]);
            }
            for (const h of p.hiddenCases) {
                await db.query(`INSERT INTO test_cases (question_id, input, expected_output, is_hidden) VALUES (?, ?, ?, TRUE)`, [p.id, h.input, h.output]);
            }
        }
        console.log("✅ Problems & Test Cases seeded");

    } catch (error) {
        console.error("Migration Failed:", error);
    } finally {
        process.exit();
    }
};

runMigration();
