const express = require('express');

const router = express.Router();

router.post('/', (req, res, next) => {
    res.send('create new folder route');
})

router.get('/:folderId', (req, res, next) => {
    res.send(`get a folder of ID : ${req.params.folderId}`);
})

router.delete('/:folderId', (req, res, next) => {
    res.send(`delete a folder ${req.params.folderId}`);
})

module.exports = router;