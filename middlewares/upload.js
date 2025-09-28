const multer = require('multer');


const storage = multer.memoryStorage();


const DANGEROUS_MIME_TYPES = [
    'application/x-msdownload',
    'application/javascript',
    'application/x-sh',
    'text/html',
];


const fileFilter = (req, file, cb) => {

    if (DANGEROUS_MIME_TYPES.includes(file.mimetype)) {
        return cb(new Error('This file type is not allowed for security reasons.'), false);
    }

    cb(null, true);
};


const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE)
    }
});

const profilePicUploader = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        // Only allow image file types
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type, only images are allowed!'), false);
        }
    },
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit for profile pictures
});

module.exports = {
    upload, // for generic files
    profilePicUploader // for profile pics
};