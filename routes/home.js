const express = require('express');

const router = express.Router();

router.get('/', (req, res, next) => {
    res.send('this is home route');
})

module.exports = router;