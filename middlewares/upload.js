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

module.exports = upload;