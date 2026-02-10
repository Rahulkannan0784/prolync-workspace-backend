import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const seedData = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('Clearing existing data...');
        await connection.query('DELETE FROM activity_logs');
        await connection.query('DELETE FROM enrollments');
        await connection.query('DELETE FROM courses');

        // Check if admin user exists, if not create one
        const [users] = await connection.query('SELECT * FROM users WHERE email = ?', ['admin@prolync.com']);
        let userId;
        if (users.length === 0) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);
            const [result] = await connection.query(
                'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                ['Admin User', 'admin@prolync.com', hashedPassword, 'Admin']
            );
            userId = result.insertId;
            console.log('Created Admin User');
        } else {
            userId = users[0].id;
            console.log('Admin User exists');
        }


        console.log('Seeding Courses...');
        const courses = [
            ['Full Stack Web Development', 'Master the MERN stack with this comprehensive course.', 'Robert Brown', 'Beginner', 49.99, 'Published'],
            ['Data Science with Python', 'Learn data analysis, visualization and ML.', 'Jane Smith', 'Intermediate', 59.99, 'Published'],
            ['UI/UX Design Masterclass', 'Design beautiful interfaces and user experiences.', 'Sarah Lee', 'Beginner', 39.99, 'Published'],
            ['Advanced React Patterns', 'Take your React skills to the next level.', 'Mike Chen', 'Advanced', 45.00, 'Published'],
            ['Cloud Computing with AWS', 'Deploy and manage applications on the cloud.', 'David Wilson', 'Intermediate', 65.00, 'Draft']
        ];

        for (const course of courses) {
            await connection.query(
                'INSERT INTO courses (title, description, instructor, level, price, status) VALUES (?, ?, ?, ?, ?, ?)',
                course
            );
        }

        console.log('Seeding Enrollments...');
        // Get all course IDs
        const [courseRows] = await connection.query('SELECT id FROM courses');

        // Mock some enrollments for the admin user (or any user)
        if (courseRows.length > 0) {
            await connection.query('INSERT INTO enrollments (user_id, course_id, progress, completed) VALUES (?, ?, ?, ?)', [userId, courseRows[0].id, 100, true]);
            await connection.query('INSERT INTO enrollments (user_id, course_id, progress, completed) VALUES (?, ?, ?, ?)', [userId, courseRows[1].id, 45, false]);
            await connection.query('INSERT INTO enrollments (user_id, course_id, progress, completed) VALUES (?, ?, ?, ?)', [userId, courseRows[2].id, 10, false]);
        }

        console.log('Seeding Activity Logs...');
        const activities = [
            [userId, 'LOGIN', 'User logged in successfully', '127.0.0.1'],
            [userId, 'ENROLL', 'Enrolled in Full Stack Web Development', '127.0.0.1'],
            [userId, 'COMPLETE_LESSON', 'Completed Lesson 1: Introduction', '127.0.0.1'],
            [userId, 'LOGIN', 'User logged in successfully', '127.0.0.1'],
        ];

        for (const activity of activities) {
            await connection.query(
                'INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
                activity
            );
        }

        console.log('Seeding completed successfully.');
        await connection.end();
    } catch (error) {
        console.error('Error seeding data:', error);
    }
};

seedData();
