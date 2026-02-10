
import db from './config/db.js';
import bcrypt from 'bcryptjs';

(async () => {
    try {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await db.query(`
            INSERT INTO users (name, email, password, role, status)
            VALUES ('Test Admin', 'admin@test.com', ?, 'admin', 'Active')
            ON DUPLICATE KEY UPDATE password = ?
        `, [hashedPassword, hashedPassword]);
        console.log('Admin created: admin@test.com / admin123');
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
