const express = require('express');

const router = express.Router();

router.post('/login', (req, res, next) => {
    res.send('login route');
})

router.post('/logout', (req, res, next) => {
    res.send('logout route');
})

router.get('/session', (req, res, next) => {
    res.send('this route is for check if session is valid (for frontend auto-login).')
})

module.exports = router;