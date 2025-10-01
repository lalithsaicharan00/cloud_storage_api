const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { profilePicUploader } = require('../middlewares/upload');
const isAuth = require('../middlewares/isAuth');
const resendOtpLimiter = require('../config/rateLimiter');


router.post('/', userController.registerUser);
router.get('/:userId', userController.getUserProfile);
router.put('/me', isAuth, profilePicUploader.single('profileImage'), userController.updateMyProfile);
router.put('/me/email', isAuth, userController.requestEmailChange);
router.post('/me/email/resend-code', isAuth, resendOtpLimiter, userController.resendEmailChangeCode);
router.post('/me/email/verify', isAuth, userController.verifyEmailChange);
router.delete('/', isAuth, userController.deleteUserAccount);


module.exports = router;