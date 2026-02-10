
import db from './config/db.js';

(async () => {
    try {
        const [users] = await db.query("SELECT email, role, password FROM users WHERE role = 'admin' LIMIT 5");
        console.log('Admins:', users);
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
