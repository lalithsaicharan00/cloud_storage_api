const express = require('express');
const router = express.Router();

const isAuth = require('../middlewares/isAuth');
const authController = require('../controllers/authController')


router.post('/login', authController.loginUser)
router.post('/logout', isAuth, authController.logoutUser)
router.get('/session', isAuth, authController.getCurrentUser)


module.exports = router;