import db from '../config/db.js';

// Predefined Triggers
const TRIGGERS = {
    PROBLEMS_SOLVED: 'PROBLEMS_SOLVED',
    TOTAL_SUBMISSIONS: 'TOTAL_SUBMISSIONS',
    CODING_STREAK: 'CODING_STREAK',
    FIRST_PROBLEM: 'FIRST_PROBLEM',
    FIRST_HARD_PROBLEM: 'FIRST_HARD_PROBLEM',
    COURSES_COMPLETED: 'COURSES_COMPLETED',
    LEARNING_HOURS: 'LEARNING_HOURS',
    FIRST_COURSE: 'FIRST_COURSE',
    PROJECTS_COMPLETED: 'PROJECTS_COMPLETED',
    FIRST_PROJECT_SUBMITTED: 'FIRST_PROJECT_SUBMITTED',
    LOGIN_STREAK: 'LOGIN_STREAK',
    ACTIVE_DAYS: 'ACTIVE_DAYS',
    SCENARIOS_SOLVED: 'SCENARIOS_SOLVED',
    KITS_COMPLETED: 'KITS_COMPLETED'
};

const badgeService = {
    TRIGGERS,

    /**
     * Check and award badges based on a trigger event.
     * @param {number} userId - The ID of the user.
     * @param {string} triggerType - The type of trigger (e.g., 'PROBLEMS_SOLVED').
     * @param {number} triggerValue - The current value associated with the trigger (e.g., 5 problems).
     */
    checkAndAwardBadges: async (userId, triggerType, triggerValue = 0) => {
        try {
            console.log(`Checking badges for User: ${userId}, Trigger: ${triggerType}, Value: ${triggerValue}`);

            // 1. Fetch relevant badges
            // Find badges with the matching trigger type
            // For numeric triggers (like count), we check if the badge's required value is <= current value
            // For event triggers (value 0), we just check based on type
            const [badges] = await db.query(`
                SELECT * FROM badges 
                WHERE is_active = TRUE 
                AND trigger_type = ? 
                AND trigger_value <= ?
            `, [triggerType, triggerValue]);

            if (badges.length === 0) return;

            // 2. Award eligible badges if not already owned
            for (const badge of badges) {
                try {
                    await db.query(`
                        INSERT INTO user_badges (user_id, badge_id) 
                        VALUES (?, ?)
                    `, [userId, badge.id]);

                    console.log(`Awarded Badge: ${badge.name} to User: ${userId}`);
                    // Ideally, trigger a notification here
                } catch (error) {
                    if (error.code === 'ER_DUP_ENTRY') {
                        // User already has this badge, ignore
                    } else {
                        console.error('Error awarding badge:', error);
                    }
                }
            }

        } catch (error) {
            console.error('Badge Service Error:', error);
        }
    }
};

export default badgeService;
