import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
    destination(req, file, cb) {
        let folder = 'uploads/';
        if (req.baseUrl.includes('courses') || (req.body && req.body.type === 'course')) {
            folder = 'uploads/courses/';
        } else if (req.baseUrl.includes('news')) {
            folder = 'uploads/news/';
        } else if (req.baseUrl.includes('placements') || req.url.includes('placements')) {
            folder = 'uploads/placements/';
        } else if (req.baseUrl.includes('mentorship') || req.url.includes('mentorship')) {
            folder = 'uploads/mentors/';
        }

        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
        }
        cb(null, folder);
    },
    filename(req, file, cb) {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    },
});

function checkFileType(file, cb) {
    const filetypes = /jpg|jpeg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Images only!'));
    }
}

const upload = multer({
    storage,
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    },
});

export default upload;
