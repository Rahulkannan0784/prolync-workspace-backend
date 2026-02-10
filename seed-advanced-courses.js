import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

const courses = [
    {
        title: "Full Stack Web Development",
        description: "Master the MERN stack with this comprehensive bootcamp.",
        instructor: "Sarah Jenkins",
        category: "Web Dev",
        level: "Advanced",
        price: 99.99,
        status: "Published",
        thumbnail: "https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&w=800&q=80"
    },
    {
        title: "Artificial Intelligence Mastery",
        description: "Deep dive into Neural Networks, Python, and TensorFlow.",
        instructor: "Dr. Alan Grant",
        category: "AI & Data",
        level: "Advanced",
        price: 149.00,
        status: "Published",
        thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80"
    },
    {
        title: "UI/UX Design Fundamentals",
        description: "Learn to design beautiful interfaces using Figma.",
        instructor: "Emily Chen",
        category: "Design",
        level: "Beginner",
        price: 49.99,
        status: "Published",
        thumbnail: "https://images.unsplash.com/photo-1586717791821-3f44a5638d48?auto=format&fit=crop&w=800&q=80"
    },
    {
        title: "Python for Data Science",
        description: "Analyze data and create visualizations with Pandas and Matplotlib.",
        instructor: "Mark Johnson",
        category: "Data Science",
        level: "Intermediate",
        price: 89.99,
        status: "Draft",
        thumbnail: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80"
    }
];

const modules = [
    { title: "Introduction & Setup", order: 1 },
    { title: "Core Concepts", order: 2 },
    { title: "Advanced Techniques", order: 3 },
    { title: "Final Project", order: 4 }
];

const lessons = [
    { title: "Getting Started", duration: 15 },
    { title: "Installation Guide", duration: 10 },
    { title: "Hello World", duration: 20 },
    { title: "Deep Dive Project", duration: 45 }
];

const seedCourses = async () => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log("Connected to DB...");

        // 1. Create Dummy Users (for enrollments)
        console.log("Creating dummy users...");
        const userIds = [];
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        // Check existing users first to avoid duplicates if re-running
        const [existingUsers] = await connection.query("SELECT id FROM users LIMIT 100");
        existingUsers.forEach(u => userIds.push(u.id));

        // Create 20 new random users if we have fewer than 20
        if (userIds.length < 20) {
            for (let i = 0; i < 20; i++) {
                const [res] = await connection.execute(
                    "INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)",
                    [`Student ${i}`, `student${Date.now()}_${i}@example.com`, hashedPassword, 'student', 'Active']
                );
                userIds.push(res.insertId);
            }
        }
        console.log(`Available User IDs: ${userIds.length}`);

        // 2. Insert Courses
        console.log("Seeding courses...");
        // Clear existing courses for a clean state in this demo scope? 
        // Better NOT to delete *everything* in case of production, but for this dev task it's safer to ensure we see exactly what we want.
        // Let's just append or check duplicates. We'll append.

        for (const c of courses) {
            const [cRes] = await connection.execute(
                `INSERT INTO courses (title, description, instructor, thumbnail, category, level, price, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [c.title, c.description, c.instructor, c.thumbnail, c.category, c.level, c.price, c.status]
            );
            const courseId = cRes.insertId;

            // 3. Insert Modules & Lessons
            for (const m of modules) {
                const [mRes] = await connection.execute(
                    "INSERT INTO modules (course_id, title, order_index) VALUES (?, ?, ?)",
                    [courseId, m.title, m.order]
                );
                const moduleId = mRes.insertId;

                for (const l of lessons) {
                    await connection.execute(
                        "INSERT INTO lessons (module_id, title, duration, order_index) VALUES (?, ?, ?, ?)",
                        [moduleId, `${l.title} (${m.title})`, l.duration, 1] // simplifying order
                    );
                }
            }

            // 4. Enroll Random Users
            const numEnrollments = Math.floor(Math.random() * 15) + 5; // 5 to 20 enrollments per course
            const shuffledUsers = userIds.sort(() => 0.5 - Math.random());
            const selectedUsers = shuffledUsers.slice(0, numEnrollments);

            for (const uid of selectedUsers) {
                const progress = Math.random() > 0.5 ? Math.floor(Math.random() * 100) : 100; // Some completed, some partial
                await connection.execute(
                    "INSERT INTO enrollments (user_id, course_id, progress, completed) VALUES (?, ?, ?, ?)",
                    [uid, courseId, progress, progress === 100]
                );

                // Add Rating
                if (Math.random() > 0.7) {
                    await connection.execute(
                        "INSERT INTO course_ratings (user_id, course_id, rating, review) VALUES (?, ?, ?, ?)",
                        [uid, courseId, Math.floor(Math.random() * 2) + 4, "Great course!"] // 4 or 5 stars
                    );
                }
            }
        }

        console.log("Seeding completed successfully.");
        await connection.end();
    } catch (error) {
        console.error("Seeding failed:", error);
    }
};

seedCourses();
