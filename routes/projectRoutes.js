
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import {
    addProject, getAllProjects, getProjectById, updateProject, deleteProject,
    showInterest, submitProject, getMyProjects,
    getPendingSubmissions, reviewProject
} from '../controllers/projectController.js';

const router = express.Router();

router.post('/add', addProject);
router.get('/all', getAllProjects);
router.get('/detail/:id', getProjectById);
router.put('/update/:id', updateProject);
router.delete('/delete/:id', deleteProject);

// Configure Multer for Screenshots
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../uploads/project_submissions');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, 'screenshot-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only images are allowed!'));
    }
});

router.post('/upload', upload.single('screenshot'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    // Return the URL relative to the server
    const fileUrl = `/uploads/project_submissions/${req.file.filename}`;
    res.json({ url: fileUrl });
});

// Student Workflow
router.post('/interest', showInterest); // Was apply, now interest
router.post('/submit', submitProject);   // Final submission
router.get('/my-projects', getMyProjects);

// Admin Review
router.get('/submissions', getPendingSubmissions);
router.post('/review', reviewProject);

export default router;
