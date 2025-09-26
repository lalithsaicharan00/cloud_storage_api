const express = require('express');

const router = express.Router();

router.post('/upload', (req, res, next) => {
    res.send('upload new file to server');
})

router.get('/:fileId', (req, res, next) => {
    res.send('get a file by id');
})


router.get('/:fileId/download', (req, res, next) => {
    res.send('download a file by id');
})

router.delete('/:fileId', (req, res, next) => {
    res.send('delete a file');
})

module.exports = router;