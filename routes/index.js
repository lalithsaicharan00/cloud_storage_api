
const auth = require('./auth');
const files = require('./files');
const folders = require('./folders');
const users = require('./users');



const express = require('express');

const router = express.Router();

router.use('/auth', auth);
router.use('/files', files);
router.use('/folders', folders);
router.use('/users', users);

module.exports = router;