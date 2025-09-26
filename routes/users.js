const express = require('express');

const router = express.Router();

router.post('/', (req, res, next) => {
    res.send('this is users route');
    console.log(router);
})

router.get('/:userId', (req, res, next) => {
    res.send(`this is users route user ID is ${req.params.userId}`);
    console.log(router);
})

router.delete('/:userId', (req, res, next) => {
    res.send(`this is delete user route ID : ${req.params.userId}`);
    console.log(router);
})

module.exports = router;

