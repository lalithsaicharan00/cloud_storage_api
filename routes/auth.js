const express = require('express');
const isAuth = require('../middlewares/isAuth');
const authController = require('../controllers/authController')

const router = express.Router();

router.post('/login', authController.loginUser)

router.post('/logout', isAuth, authController.logoutUser)

router.get('/session', isAuth, authController.getCurrentUser)

module.exports = router;