
import express from 'express';
import multer from 'multer';
import path from 'path';
import {
    getProfile,
    updateProfile,
    uploadAvatar,
    uploadResume,
    changePassword,
    getSettings,
    updateSettings
} from '../controllers/profileController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'avatar') {
            cb(null, 'uploads/profile-images/');
        } else if (file.fieldname === 'resume') {
            cb(null, 'uploads/resumes/');
        } else {
            cb(new Error('Invalid upload field'), null);
        }
    },
    filename: (req, file, cb) => {
        // Safe filename: timestamp-originalName
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// File Filter
const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'avatar') {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)$/i)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
    } else if (file.fieldname === 'resume') {
        if (!file.originalname.match(/\.(pdf|doc|docx)$/i)) {
            return cb(new Error('Only PDF, DOC, and DOCX files are allowed!'), false);
        }
    }
    cb(null, true);
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Routes
router.get('/me', protect, getProfile);
router.put('/update', protect, updateProfile);
router.post('/upload-avatar', protect, upload.single('avatar'), uploadAvatar);
router.post('/upload-resume', protect, upload.single('resume'), uploadResume);
router.post('/change-password', protect, changePassword);

// Legacy/Compatibility routes
router.get('/settings', protect, getSettings);
router.put('/settings', protect, updateSettings);

export default router;
