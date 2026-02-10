import express from 'express';
import { addNews, getAllNews, updateNews, deleteNews, getPublicNews, incrementView } from '../controllers/newsController.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/public', getPublicNews);
router.post('/add', upload.single('image'), addNews);
router.get('/', getAllNews);
router.put('/update/:id', upload.single('image'), updateNews);
router.delete('/delete/:id', deleteNews);
router.post('/increment-view/:id', incrementView);

export default router;
