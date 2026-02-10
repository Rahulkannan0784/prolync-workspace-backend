import express from 'express';
import multer from 'multer'; // Import multer
import path from 'path';
import fs from 'fs';
import {
    bookSession,
    getAllSessions,
    getStudentBookings,
    addMentor,
    getAllMentors,
    updateMentor,
    deleteMentor
} from '../controllers/mentorshipController.js';

const router = express.Router();

// --- Multer Configuration ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/mentors/';
        // Create directory if it doesn't exist
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// --- Booking Routes ---
router.post('/book', bookSession);
router.get('/sessions', getAllSessions);
router.get('/my-bookings', getStudentBookings);

// --- Mentor Management Routes ---
router.post('/add', upload.single('image'), addMentor);
router.get('/all', getAllMentors);
router.put('/update/:id', upload.single('image'), updateMentor);
router.delete('/delete/:id', deleteMentor);

export default router;
