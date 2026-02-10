import 'dotenv/config';
console.log('Testing imports...');
try {
    await import('./routes/auth.js');
    console.log('Auth Routes: OK');
    await import('./routes/adminRoutes.js');
    console.log('Admin Routes: OK');
    await import('./controllers/dashboardController.js');
    console.log('Dashboard Controller: OK');
} catch (e) {
    console.error('Import Error:', e);
}
