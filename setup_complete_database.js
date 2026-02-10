
import db from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const setupCompleteDatabase = async () => {
    try {
        console.log("Starting comprehensive table setup...");

        // --- LEVEL 1: Independent / Core Tables ---

        // 1. COURSES
        await db.query(`
            CREATE TABLE IF NOT EXISTS courses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                instructor VARCHAR(100),
                thumbnail VARCHAR(255),
                category VARCHAR(50),
                level ENUM('Beginner', 'Intermediate', 'Advanced') DEFAULT 'Beginner',
                price DECIMAL(10, 2) DEFAULT 0.00,
                status ENUM('Draft', 'Published', 'Archived') DEFAULT 'Draft',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log("✔ courses");

        // 2. MENTORS
        await db.query(`
            CREATE TABLE IF NOT EXISTS mentors (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                role VARCHAR(255) NOT NULL,
                company VARCHAR(255),
                bio TEXT,
                image_url VARCHAR(500),
                skills TEXT,
                focus TEXT,
                is_certified BOOLEAN DEFAULT FALSE,
                is_verified BOOLEAN DEFAULT FALSE,
                is_top_rated BOOLEAN DEFAULT FALSE,
                session_type VARCHAR(255),
                availability TEXT,
                max_participants INT DEFAULT 1,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log("✔ mentors");

        // 3. PLACEMENTS
        await db.query(`
            CREATE TABLE IF NOT EXISTS placements (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                company VARCHAR(255) NOT NULL,
                role VARCHAR(255),
                package VARCHAR(100),
                batch VARCHAR(50),
                type ENUM('Placement', 'Internship', 'Success Story') DEFAULT 'Success Story',
                image_url VARCHAR(500),
                video_url VARCHAR(500),
                description TEXT,
                tips TEXT,
                interview_experience TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log("✔ placements");

        // 4. DAILY STATS (Independent stats)
        await db.query(`
             CREATE TABLE IF NOT EXISTS daily_stats (
                id INT AUTO_INCREMENT PRIMARY KEY,
                date DATE NOT NULL UNIQUE,
                active_users INT DEFAULT 0,
                problems_solved INT DEFAULT 0,
                videos_watched INT DEFAULT 0,
                total_learning_hours DECIMAL(10, 2) DEFAULT 0.00,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
             )
        `);
        console.log("✔ daily_stats");


        // --- LEVEL 2: Dependent Tables ---

        // 5. COURSE MODULES
        await db.query(`
            CREATE TABLE IF NOT EXISTS course_modules (
                id INT AUTO_INCREMENT PRIMARY KEY,
                course_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                video_path VARCHAR(255),
                duration_seconds INT DEFAULT 0,
                order_index INT DEFAULT 0,
                is_locked BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
            )
        `);
        console.log("✔ course_modules");

        // 6. COURSE REQUIREMENTS
        await db.query(`
            CREATE TABLE IF NOT EXISTS course_requirements (
                id INT AUTO_INCREMENT PRIMARY KEY,
                course_id INT NOT NULL,
                requirement TEXT NOT NULL,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
            )
        `);
        console.log("✔ course_requirements");

        // 7. COURSE LEARNINGS (What you'll learn)
        await db.query(`
            CREATE TABLE IF NOT EXISTS course_learnings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                course_id INT NOT NULL,
                learning_point TEXT NOT NULL,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
            )
        `);
        console.log("✔ course_learnings");

        // 8. COURSE RATINGS
        await db.query(`
            CREATE TABLE IF NOT EXISTS course_ratings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                course_id INT NOT NULL,
                user_id INT NOT NULL,
                rating INT CHECK (rating >= 1 AND rating <= 5),
                review TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log("✔ course_ratings");

        // 9. PLACEMENT BLOGS
        await db.query(`
            CREATE TABLE IF NOT EXISTS placement_blogs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                author VARCHAR(255),
                content TEXT,
                tags VARCHAR(255),
                image_url VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("✔ placement_blogs");

        // 10. MENTORSHIP SESSIONS (Defines types of sessions usually, or specific scheduled sessions)
        // Assuming this tracks sessions *available* or *history*. 
        // Based on context, `mentor_bookings` seems to be the user booking.
        // Let's create a table for sessions defined by mentors.
        await db.query(`
           CREATE TABLE IF NOT EXISTS mentorship_sessions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                mentor_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                duration_minutes INT DEFAULT 30,
                price DECIMAL(10,2) DEFAULT 0.00,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (mentor_id) REFERENCES mentors(id) ON DELETE CASCADE
           )
        `);
        console.log("✔ mentorship_sessions");

        // 11. ENROLLMENTS / USER_COURSES
        // The user asked for `enrollments` AND `user_courses`? Usually they are the same.
        // I'll create `enrollments` as an alias or separate if needed, but usually `user_courses` handles it.
        // Let's create `enrollments` table just in case it's used separately.
        await db.query(`
            CREATE TABLE IF NOT EXISTS enrollments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                course_id INT NOT NULL,
                enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status ENUM('active', 'completed', 'dropped') DEFAULT 'active',
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
                UNIQUE KEY unique_enrollment_alias (user_id, course_id)
            )
        `);
        console.log("✔ enrollments");

        // --- LEVEL 3: User Progress & Details ---

        // 12. USER PROGRESS (Course Level)
        await db.query(`
            CREATE TABLE IF NOT EXISTS user_progress (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                course_id INT NOT NULL,
                completed_modules INT DEFAULT 0,
                total_modules INT DEFAULT 0,
                completion_percent INT DEFAULT 0,
                status ENUM('Not Started', 'In Progress', 'Completed') DEFAULT 'Not Started',
                last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_course_progress (user_id, course_id)
            )
        `);
        console.log("✔ user_progress");

        // 13. STUDENT VIDEO PROGRESS (Module Level)
        await db.query(`
            CREATE TABLE IF NOT EXISTS student_video_progress (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                module_id INT NOT NULL,
                course_id INT NOT NULL,
                watched_seconds INT DEFAULT 0,
                is_completed BOOLEAN DEFAULT FALSE,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_video_progress (user_id, module_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (module_id) REFERENCES course_modules(id) ON DELETE CASCADE,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
            )
        `);
        console.log("✔ student_video_progress");

        // 14. MENTOR SLOTS (Availability)
        await db.query(`
             CREATE TABLE IF NOT EXISTS mentor_slots (
                id INT AUTO_INCREMENT PRIMARY KEY,
                mentor_id INT NOT NULL,
                start_time DATETIME NOT NULL,
                end_time DATETIME NOT NULL,
                is_booked BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (mentor_id) REFERENCES mentors(id) ON DELETE CASCADE
             )
        `);
        console.log("✔ mentor_slots");

        // 15. LEARNING ACTIVITY (Daily logs)
        await db.query(`
            CREATE TABLE IF NOT EXISTS learning_activity (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                course_id INT,
                video_id INT,
                time_spent_seconds INT DEFAULT 0,
                activity_date DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
            )
        `);
        console.log("✔ learning_activity");

        // 16. SHARED PROGRESS (Social)
        await db.query(`
            CREATE TABLE IF NOT EXISTS shared_progress (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                content_type VARCHAR(50), -- 'badge', 'certificate', 'milestone'
                content_id VARCHAR(255),
                share_platform VARCHAR(50),
                shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log("✔ shared_progress");

        // 17. LESSONS (Often synonymous with modules, but if requested separately)
        // I will creating it as a sub-unit of modules if needed, or just a standalone table if the architecture uses it.
        // Assuming it might be 'Text Lessons' inside a module.
        await db.query(`
            CREATE TABLE IF NOT EXISTS lessons (
                id INT AUTO_INCREMENT PRIMARY KEY,
                module_id INT,
                course_id INT,
                title VARCHAR(255),
                content TEXT,
                order_index INT DEFAULT 0,
                FOREIGN KEY (module_id) REFERENCES course_modules(id) ON DELETE CASCADE
            )
        `);
        console.log("✔ lessons");

        console.log("All requested tables have been checked/created successfully.");
        process.exit(0);

    } catch (error) {
        console.error("Setup failed:", error);
        process.exit(1);
    }
};

setupCompleteDatabase();
