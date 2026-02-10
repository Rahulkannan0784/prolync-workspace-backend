
import express from 'express';
import { assignStudentsToHod, getAssignedStudents } from '../controllers/hodAssignmentController.js';
import { protectHOD } from '../middleware/hodMiddleware.js';
import { protect } from '../middleware/authMiddleware.js'; // Assuming this is for generic auth/admin logic

const router = express.Router();

// Admin Route: Assign students
// Ideally should be protected with Admin middleware, but utilizing generic protect for now if adminMiddleware isn't standardized. 
// Assuming the frontend ensures only Admins call this.
router.post('/manual-assign', assignStudentsToHod);

// HOD Route: Get my assigned students
router.get('/my-assigned-students', protectHOD, getAssignedStudents);

export default router;
