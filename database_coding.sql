CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    difficulty ENUM('Easy', 'Medium', 'Hard') NOT NULL,
    template_code JSON, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS test_cases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    input TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    is_hidden BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    question_id INT NOT NULL,
    code TEXT NOT NULL,
    language VARCHAR(50) NOT NULL,
    status ENUM('Pending', 'Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Compilation Error', 'Runtime Error') DEFAULT 'Pending',
    output TEXT,
    execution_time FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert Sample Data for Two Sum
INSERT INTO questions (title, description, difficulty, template_code) VALUES 
(
    'Two Sum', 
    'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.', 
    'Easy',
    '{
        "python": "def two_sum(nums, target):\\n    # Write your code here\\n    pass",
        "javascript": "function twoSum(nums, target) {\\n    // Write your code here\\n}",
        "java": "class Solution {\\n    public int[] twoSum(int[] nums, int target) {\\n        // Write your code here\\n        return new int[]{};\\n    }\\n}",
        "cpp": "class Solution {\\npublic:\\n    vector<int> twoSum(vector<int>& nums, int target) {\\n        // Write your code here\\n        return {};\\n    }\\n};"
    }'
);

INSERT INTO test_cases (question_id, input, expected_output, is_hidden) VALUES 
(1, '2 7 11 15\n9', '[0, 1]', FALSE),
(1, '3 2 4\n6', '[1, 2]', FALSE),
(1, '3 3\n6', '[0, 1]', TRUE);
