import express from 'express';
import {
    getAllCourses, getCourseById, createCourse, updateCourse, deleteCourse,
    getCourseAnalytics, getCourseCurriculum, getCourseStudents, enrollUser,
    updateCourseProgress, getStudentEnrollments, logProgress
} from '../controllers/courseController.js';
import upload from '../middleware/uploadMiddleware.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getAllCourses);
router.get('/my-courses', protect, getStudentEnrollments); // Must be before /:id
router.post('/', protect, admin, upload.single('thumbnail'), createCourse);
router.put('/:id', protect, admin, upload.single('thumbnail'), updateCourse);
router.delete('/:id', protect, admin, deleteCourse);
router.post('/:id/enroll', protect, enrollUser);
router.put('/:id/progress', protect, updateCourseProgress);
router.post('/progress/update', protect, logProgress);

// Advanced Module Routes
router.get('/:id', getCourseById);
router.get('/:id/analytics', protect, admin, getCourseAnalytics);
router.get('/:id/curriculum', protect, admin, getCourseCurriculum);
router.get('/:id/students', protect, admin, getCourseStudents);

export default router;
