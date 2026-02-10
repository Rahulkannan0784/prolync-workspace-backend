import express from 'express';
import { uploadPlacementBlog } from '../middleware/uploadPlacementBlog.js';
import {
    createPlacementBlog,
    getAllPlacementBlogs,
    getActivePlacementBlogs,
    getPlacementBlogById,
    updatePlacementBlog,
    deletePlacementBlog,
    incrementPlacementBlogView
} from '../controllers/placementBlogController.js';

const router = express.Router();

// Public routes (for students)
router.get('/active', getActivePlacementBlogs);
router.get('/:id', getPlacementBlogById);
router.post('/view/:id', incrementPlacementBlogView);

// Admin routes (should add auth middleware in production)
router.post('/', uploadPlacementBlog.single('thumbnail'), createPlacementBlog);
router.get('/', getAllPlacementBlogs);
router.put('/:id', uploadPlacementBlog.single('thumbnail'), updatePlacementBlog);
router.delete('/:id', deletePlacementBlog);

export default router;
