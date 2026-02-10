import db from './config/db.js';
import bcrypt from 'bcryptjs';

async function resetPassword() {
    const email = 'srid52863@gmail.com';
    const newPassword = 'password123';

    try {
        console.log(`Resetting password for: ${email}`);

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        const [result] = await db.query(
            'UPDATE users SET password = ? WHERE email = ?',
            [hashedPassword, email]
        );

        if (result.affectedRows > 0) {
            console.log(`Password reset successfully to '${newPassword}'`);
        } else {
            console.log('User not found, creating user...');
            const [insert] = await db.query(
                'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
                ['Sridhar', email, hashedPassword]
            );
            console.log(`User created with password '${newPassword}'`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error resetting password:', error);
        process.exit(1);
    }
}

resetPassword();
