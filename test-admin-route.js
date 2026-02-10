import 'dotenv/config';
console.log('Testing Admin Route Import...');
try {
    await import('./routes/adminRoutes.js');
    console.log('Admin Routes Import: OK');
} catch (e) {
    console.error('Admin Routes Import Failed:', e);
}
