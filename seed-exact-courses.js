
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
    // --- FRONTEND (10 Courses) ---
    {
        id: 1,
        title: 'React.js Complete Guide',
        category: 'Frontend',
        thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=225&fit=crop',
        instructor: 'John Smith',
        duration: '10 Modules',
        difficulty: 'Intermediate',
        totalVideos: 10,
    },
    {
        id: 2,
        title: 'Advanced CSS & Sass',
        category: 'Frontend',
        thumbnail: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=400&h=225&fit=crop',
        instructor: 'Emily blunt',
        duration: '8 Modules',
        difficulty: 'Beginner',
        totalVideos: 24,
    },
    {
        id: 3,
        title: 'Modern JavaScript Bootcamp',
        category: 'Frontend',
        thumbnail: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=400&h=225&fit=crop',
        instructor: 'Michael Brown',
        duration: '12 Modules',
        difficulty: 'Intermediate',
        totalVideos: 45,
    },
    {
        id: 4,
        title: 'Vue.js 3: The Complete Guide',
        category: 'Frontend',
        thumbnail: 'https://images.unsplash.com/photo-1661956602116-aa6865609028?w=400&h=225&fit=crop',
        instructor: 'Sarah Wilson',
        duration: '15 Modules',
        difficulty: 'Advanced',
        totalVideos: 50,
    },
    {
        id: 5,
        title: 'Angular - The Complete Guide',
        category: 'Frontend',
        thumbnail: 'https://images.unsplash.com/photo-1590595906931-81f04f0ccebb?w=400&h=225&fit=crop',
        instructor: 'David Miller',
        duration: '14 Modules',
        difficulty: 'Intermediate',
        totalVideos: 38,
    },
    {
        id: 6,
        title: 'Tailwind CSS From Scratch',
        category: 'Frontend',
        thumbnail: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=400&h=225&fit=crop',
        instructor: 'Chris Evans',
        duration: '6 Modules',
        difficulty: 'Beginner',
        totalVideos: 15,
    },
    {
        id: 7,
        title: 'Next.js & React - The Complete Guide',
        category: 'Frontend',
        thumbnail: 'https://images.unsplash.com/photo-1653387137517-fbc54d488fa8?w=400&h=225&fit=crop',
        instructor: 'Maximilian S.',
        duration: '20 Modules',
        difficulty: 'Advanced',
        totalVideos: 60,
    },
    {
        id: 8,
        title: 'Web Design for Developers',
        category: 'Frontend',
        thumbnail: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=400&h=225&fit=crop',
        instructor: 'Jonas S.',
        duration: '10 Modules',
        difficulty: 'Intermediate',
        totalVideos: 25,
    },
    {
        id: 9,
        title: 'TypeScript for Beginners',
        category: 'Frontend',
        thumbnail: 'https://images.unsplash.com/photo-1629904853716-600abd17529c?w=400&h=225&fit=crop',
        instructor: 'Stephen Grider',
        duration: '8 Modules',
        difficulty: 'Beginner',
        totalVideos: 20,
    },
    {
        id: 10,
        title: 'Frontend Interview Preparation',
        category: 'Frontend',
        thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=225&fit=crop',
        instructor: 'Akshay Saini',
        duration: '10 Modules',
        difficulty: 'Advanced',
        totalVideos: 30,
    },

    // --- BACKEND (10 Courses) ---
    {
        id: 11,
        title: 'Node.js & Express Masterclass',
        category: 'Backend',
        thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=225&fit=crop',
        instructor: 'Sarah Johnson',
        duration: '10 Modules',
        difficulty: 'Intermediate',
        totalVideos: 10,
    },
    {
        id: 12,
        title: 'Python Django - The Practical Guide',
        category: 'Backend',
        thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=225&fit=crop',
        instructor: 'Brad Traversy',
        duration: '15 Modules',
        difficulty: 'Intermediate',
        totalVideos: 40,
    },
    {
        id: 13,
        title: 'Java Spring Boot Microservices',
        category: 'Backend',
        thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=225&fit=crop',
        instructor: 'Chad Darby',
        duration: '25 Modules',
        difficulty: 'Advanced',
        totalVideos: 100,
    },
    {
        id: 14,
        title: 'Go: The Complete Developer\'s Guide',
        category: 'Backend',
        thumbnail: 'https://images.unsplash.com/photo-1623282033815-40b05d96c903?w=400&h=225&fit=crop',
        instructor: 'Stephen Grider',
        duration: '12 Modules',
        difficulty: 'Intermediate',
        totalVideos: 45,
    },
    {
        id: 15,
        title: 'SQL & Database Design A-Z',
        category: 'Backend',
        thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&h=225&fit=crop',
        instructor: 'Kirill Eremenko',
        duration: '10 Modules',
        difficulty: 'Beginner',
        totalVideos: 30,
    },
    {
        id: 16,
        title: 'Docker & Kubernetes: The Practical Guide',
        category: 'Backend',
        thumbnail: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=400&h=225&fit=crop',
        instructor: 'Maximilian S.',
        duration: '15 Modules',
        difficulty: 'Advanced',
        totalVideos: 60,
    },
    {
        id: 17,
        title: 'NestJS - A Progressive Node.js Framework',
        category: 'Backend',
        thumbnail: 'https://images.unsplash.com/photo-1610986603166-f78428624e76?w=400&h=225&fit=crop',
        instructor: 'Kamil Mysliwiec',
        duration: '12 Modules',
        difficulty: 'Intermediate',
        totalVideos: 40,
    },
    {
        id: 18,
        title: 'Rust Programming for Beginners',
        category: 'Backend',
        thumbnail: 'https://images.unsplash.com/photo-1535551951406-a19828b8e76b?w=400&h=225&fit=crop',
        instructor: 'Nathan Stocks',
        duration: '10 Modules',
        difficulty: 'Intermediate',
        totalVideos: 35,
    },
    {
        id: 19,
        title: 'GraphQL with Node.js',
        category: 'Backend',
        thumbnail: 'https://images.unsplash.com/photo-1555099962-4199c345e5dd?w=400&h=225&fit=crop',
        instructor: 'Andrew Mead',
        duration: '8 Modules',
        difficulty: 'Intermediate',
        totalVideos: 25,
    },
    {
        id: 20,
        title: 'MongoDB - The Complete Developer\'s Guide',
        category: 'Backend',
        thumbnail: 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=400&h=225&fit=crop',
        instructor: 'Maximilian S.',
        duration: '12 Modules',
        difficulty: 'Beginner',
        totalVideos: 40,
    },

    // --- AI/ML (10 Courses) ---
    {
        id: 21,
        title: 'Machine Learning A-Z',
        category: 'AI/ML',
        thumbnail: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=400&h=225&fit=crop',
        instructor: 'Kirill Eremenko',
        duration: '20 Modules',
        difficulty: 'Intermediate',
        totalVideos: 80,
    },
    {
        id: 22,
        title: 'Deep Learning Specialization',
        category: 'AI/ML',
        thumbnail: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&h=225&fit=crop',
        instructor: 'Andrew Ng',
        duration: '25 Modules',
        difficulty: 'Advanced',
        totalVideos: 100,
    },
    {
        id: 23,
        title: 'Python for Data Science and ML Bootcamp',
        category: 'AI/ML',
        thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop',
        instructor: 'Jose Portilla',
        duration: '15 Modules',
        difficulty: 'Beginner',
        totalVideos: 60,
    },
    {
        id: 24,
        title: 'Artificial Intelligence Support',
        category: 'AI/ML',
        thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=225&fit=crop',
        instructor: 'Hadelin de Ponteves',
        duration: '10 Modules',
        difficulty: 'Beginner',
        totalVideos: 30,
    },
    {
        id: 25,
        title: 'Natural Language Processing with Python',
        category: 'AI/ML',
        thumbnail: 'https://images.unsplash.com/photo-1655720031554-a929595ff968?w=400&h=225&fit=crop',
        instructor: 'Jose Portilla',
        duration: '12 Modules',
        difficulty: 'Advanced',
        totalVideos: 45,
    },
    {
        id: 26,
        title: 'TensorFlow Developer Certificate',
        category: 'AI/ML',
        thumbnail: 'https://images.unsplash.com/photo-1617791160588-241658c0f566?w=400&h=225&fit=crop',
        instructor: 'Daniel Bourke',
        duration: '14 Modules',
        difficulty: 'Intermediate',
        totalVideos: 50,
    },
    {
        id: 27,
        title: 'Computer Vision with OpenCV',
        category: 'AI/ML',
        thumbnail: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=225&fit=crop',
        instructor: 'Joseph Santarcangelo',
        duration: '10 Modules',
        difficulty: 'Advanced',
        totalVideos: 35,
    },
    {
        id: 28,
        title: 'Data Analysis with Pandas',
        category: 'AI/ML',
        thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop',
        instructor: 'Boris P.',
        duration: '8 Modules',
        difficulty: 'Beginner',
        totalVideos: 25,
    },
    {
        id: 29,
        title: 'Reinforcement Learning Guide',
        category: 'AI/ML',
        thumbnail: 'https://images.unsplash.com/photo-1620825937374-87fc7d6bddc2?w=400&h=225&fit=crop',
        instructor: 'Phil Tabor',
        duration: '12 Modules',
        difficulty: 'Advanced',
        totalVideos: 40,
    },
    {
        id: 30,
        title: 'Generative AI Fundamentals',
        category: 'AI/ML',
        thumbnail: 'https://images.unsplash.com/photo-1684369176170-4663e63564d7?w=400&h=225&fit=crop',
        instructor: 'Google Cloud',
        duration: '5 Modules',
        difficulty: 'Beginner',
        totalVideos: 10,
    },

    // --- APTITUDE (10 Courses) ---
    {
        id: 31,
        title: 'Aptitude & Logical Reasoning',
        category: 'Aptitude',
        thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=225&fit=crop',
        instructor: 'Emily Davis',
        duration: '1 min per video',
        difficulty: 'Beginner',
        totalVideos: 12,
    },
    {
        id: 32,
        title: 'Quantitative Aptitude Mastery',
        category: 'Aptitude',
        thumbnail: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=400&h=225&fit=crop',
        instructor: 'Robert Wilson',
        duration: '10 Modules',
        difficulty: 'Advanced',
        totalVideos: 15,
    },
    {
        id: 33,
        title: 'Verbal Ability & Reading Comprehension',
        category: 'Aptitude',
        thumbnail: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=400&h=225&fit=crop',
        instructor: 'Sarah Thompson',
        duration: '8 Modules',
        difficulty: 'Intermediate',
        totalVideos: 12,
    },
    {
        id: 34,
        title: 'Data Interpretation & Analysis',
        category: 'Aptitude',
        thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop',
        instructor: 'Arun Sharma',
        duration: '12 Modules',
        difficulty: 'Advanced',
        totalVideos: 30,
    },
    {
        id: 35,
        title: 'Completing the Series & Analogies',
        category: 'Aptitude',
        thumbnail: 'https://images.unsplash.com/photo-1516321497487-e288fb1971d2?w=400&h=225&fit=crop',
        instructor: 'R.S. Aggarwal',
        duration: '6 Modules',
        difficulty: 'Beginner',
        totalVideos: 20,
    },
    {
        id: 36,
        title: 'Interview Puzzles & Brain Teasers',
        category: 'Aptitude',
        thumbnail: 'https://images.unsplash.com/photo-1598133894008-61f7fdb8cc3a?w=400&h=225&fit=crop',
        instructor: 'George Summers',
        duration: '5 Modules',
        difficulty: 'Intermediate',
        totalVideos: 25,
    },
    {
        id: 37,
        title: 'Speed Math Techniques',
        category: 'Aptitude',
        thumbnail: 'https://images.unsplash.com/photo-1632571401004-47b2c589b344?w=400&h=225&fit=crop',
        instructor: 'Vedic Math Academy',
        duration: '10 Modules',
        difficulty: 'Beginner',
        totalVideos: 40,
    },
    {
        id: 38,
        title: 'Critical Thinking & Deductive Logic',
        category: 'Aptitude',
        thumbnail: 'https://images.unsplash.com/photo-1571442463969-234656832dbb?w=400&h=225&fit=crop',
        instructor: 'Dr. Edward de Bono',
        duration: '8 Modules',
        difficulty: 'Advanced',
        totalVideos: 24,
    },
    {
        id: 39,
        title: 'Coding Interview Algorithms',
        category: 'Aptitude',
        thumbnail: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=400&h=225&fit=crop',
        instructor: 'Gayle Laakmann',
        duration: '15 Modules',
        difficulty: 'Advanced',
        totalVideos: 60,
    },
    {
        id: 40,
        title: 'General Knowledge & Current Affairs',
        category: 'Aptitude',
        thumbnail: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=225&fit=crop',
        instructor: 'Manorama Year Book',
        duration: '20 Modules',
        difficulty: 'Beginner',
        totalVideos: 100,
    },
];

const seedExactCourses = async () => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log("Connected to DB...");

        // 1. Clear existing courses (this will cascade to enrollments, modules, etc.)
        console.log("Deleting existing courses to ensure sync...");
        await connection.execute("DELETE FROM courses");
        // Reset Auto Increment? Might not be needed if we force IDs, but good practice.
        // await connection.execute("ALTER TABLE courses AUTO_INCREMENT = 1");

        // 2. Insert Courses with Explicit IDs
        console.log(`Seeding ${courses.length} courses...`);
        for (const c of courses) {
            // Using INSERT IGNORE or standard INSERT. Since we deleted, standard is fine.
            // Explicitly inserting 'id'
            const [cRes] = await connection.execute(
                `INSERT INTO courses (id, title, description, instructor, thumbnail, category, level, price, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    c.id,
                    c.title,
                    `${c.title} - Comprehensive course by ${c.instructor}`, // Generated description
                    c.instructor,
                    c.thumbnail,
                    c.category,
                    c.difficulty, // mapping difficulty to level
                    0.00, // Free
                    'Published'
                ]
            );

            // 3. Insert Dummy Modules for each course (to make it playable)
            // Add 3-5 modules
            const numModules = 3;
            for (let i = 1; i <= numModules; i++) {
                const [mRes] = await connection.execute(
                    "INSERT INTO modules (course_id, title, order_index) VALUES (?, ?, ?)",
                    [c.id, `Module ${i}: Core Concepts`, i]
                );
                const moduleId = mRes.insertId;

                // Add 2 lessons per module
                await connection.execute(
                    "INSERT INTO lessons (module_id, title, duration, order_index) VALUES (?, ?, ?, ?)",
                    [moduleId, `Lesson 1: Intro`, 10, 1]
                );
                await connection.execute(
                    "INSERT INTO lessons (module_id, title, duration, order_index) VALUES (?, ?, ?, ?)",
                    [moduleId, `Lesson 2: Deep Dive`, 15, 2]
                );
            }
        }

        console.log("Seeding completed successfully.");
        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
};

seedExactCourses();
