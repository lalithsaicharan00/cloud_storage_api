const express = require('express');
const router = express.Router();

const isAuth = require('../middlewares/isAuth');
const folderController = require('../controllers/folderController');


router.post('/', isAuth, folderController.createFolder);
router.get('/', isAuth, folderController.getRootContents);
router.get('/:folderId', isAuth, folderController.getFolderById);
router.delete('/:folderId', isAuth, folderController.deleteFolder);


module.exports = router;