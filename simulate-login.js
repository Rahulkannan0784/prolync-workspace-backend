
import db from './config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

async function simulateLogin() {
    console.log("Starting simulation...");
    const email = 'bavi@gmail.com'; // from screenshot
    const password = 'password'; // dummy

    try {
        console.log("Checking Admin...");
        const [admins] = await db.query('SELECT * FROM admin WHERE email = ?', [email]);
        console.log("Admin result length:", admins.length);

        console.log("Checking Users...");
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        console.log("User result length:", users.length);

        if (users.length > 0) {
            const user = users[0];
            console.log("User found:", user.email);
            console.log("Password hash:", user.password);

            if (!user.password) {
                console.error("ERROR: User has no password!");
            } else {
                console.log("Comparing password...");
                const isMatch = await bcrypt.compare(password, user.password);
                console.log("Match result:", isMatch);
            }

            console.log("Signing JWT...");
            if (!process.env.JWT_SECRET) console.error("MISSING JWT_SECRET");
            const token = jwt.sign({ id: user.id, role: 'STUDENT' }, process.env.JWT_SECRET, { expiresIn: '1d' });
            console.log("Token generated:", token ? "YES" : "NO");
        } else {
            console.log("User not found in DB.");
        }

        process.exit();

    } catch (error) {
        console.error("CRASH DURING SIMULATION:", error);
        process.exit(1);
    }
}

simulateLogin();
