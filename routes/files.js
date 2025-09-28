const express = require('express');
const router = express.Router();

const isAuth = require('../middlewares/isAuth');
const upload = require('../middleware/upload');
const fileController = require('../controllers/fileController');

router.post('/upload', isAuth, upload.array('myFiles', 5), fileController.uploadFiles);
router.get('/:fileId', isAuth, fileController.getFileById);
router.get('/:fileId/download', isAuth, fileController.downloadFile);


router.delete('/:fileId', isAuth, fileController.deleteFile);


module.exports = router;