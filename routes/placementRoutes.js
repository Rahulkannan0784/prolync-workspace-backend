import express from 'express';
import {
    addPlacement, getAllPlacements, updatePlacement, deletePlacement
} from '../controllers/placementController.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Multer Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/placements/'); // Ensure this directory exists
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.post('/add', upload.fields([{ name: 'image' }, { name: 'video' }]), addPlacement);
router.get('/all', getAllPlacements);
router.put('/update/:id', upload.fields([{ name: 'image' }, { name: 'video' }]), updatePlacement);
router.delete('/delete/:id', deletePlacement);

export default router;
