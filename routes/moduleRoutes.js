
import express from 'express';
import multer from 'multer';
import path from 'path';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
    addModule,
    deleteModule,
    getCourseModules,
    streamVideo,
    updateModuleProgress,
    getModuleProgress
} from '../controllers/moduleController.js';

const router = express.Router();

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/courses/');
    },
    filename(req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
    fileFilter: function (req, file, cb) {
        const filetypes = /mp4|webm|mkv|mov/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Error: Videos Only!'));
        }
    }
});

// Admin Route: Upload Module
router.post('/', protect, admin, upload.single('video'), addModule);
// Admin Route: Delete Module
router.delete('/:id', protect, admin, deleteModule);

// Public/Student Routes
router.get('/course/:courseId', getCourseModules);
router.get('/:id/video', streamVideo); // Open for streaming (video tag auth is complex)
router.post('/:id/progress', protect, updateModuleProgress);
router.get('/:id/progress', protect, getModuleProgress);

export default router;
