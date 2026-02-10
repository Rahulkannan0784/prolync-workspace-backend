import express from 'express';
import { getAllUsers, addUser, getColleges, getDepartments, updateUser, bulkDeleteUsers, resetUserPassword, forceLogoutUser, getUserDetails, getStudentProgress, getUserCalendarData, getUserLearningStats, getStudentCodingProfile, manageUserValidity, getActiveUsers } from '../controllers/adminController.js';
import { getDashboardStats, getActivityFeed, getChartData, getTopActiveUsers } from '../controllers/dashboardController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Dashboard Stats
router.get('/stats', protect, admin, getDashboardStats);
router.get('/activity', protect, admin, getActivityFeed);
router.get('/charts', protect, admin, getChartData);
router.get('/top-users', protect, admin, getTopActiveUsers);

// User Management
router.get('/colleges', protect, admin, getColleges);
router.get('/departments', protect, admin, getDepartments);
router.post('/users', protect, admin, addUser);
router.get('/users', protect, admin, getAllUsers);
router.get('/active-users', protect, admin, getActiveUsers);
router.get('/students/progress', protect, admin, getStudentProgress);
router.put('/users/:id', protect, admin, updateUser);
// router.post('/users/bulk-delete', protect, admin, bulkDeleteUsers); // Using POST for bulk actions often safer, but DELETE works if body supported. Let's stick to HTTP verb DELETE for semantic correctness unless client has issues.
// Actually, axios generic delete accepting body is sometimes tricky. Let's use POST for bulk delete to be safe.
// Wait, RESTful convention says DELETE. I'll stick to DELETE but handle properly on frontend.
// Actually common practice for bulk is often POST /bulk-delete. Let's do POST /users/delete-bulk for clarity.
router.post('/users/delete-bulk', protect, admin, bulkDeleteUsers);

// Security Actions
router.post('/users/:id/reset-password', protect, admin, resetUserPassword);
router.put('/users/:id/validity', protect, admin, manageUserValidity);
router.post('/users/:id/logout', protect, admin, forceLogoutUser);
router.get('/users/:id', protect, admin, getUserDetails);
router.get('/users/:id/calendar', protect, admin, getUserCalendarData);
router.get('/users/:id/stats', protect, admin, getUserLearningStats);
router.get('/users/:id/coding', protect, admin, getStudentCodingProfile);

export default router;
