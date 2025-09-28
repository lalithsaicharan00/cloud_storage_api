const express = require('express');
const router = express.Router();

const isAuth = require('../middlewares/isAuth');
const authController = require('../controllers/authController')

// It's compulsory to send the email of the user in the body when someone is requesting an OTP at this route
router.post('/resend-verification', resendOtpLimiter, authController.resendVerificationEmail);
// must send Email and OTP in the body of the request
router.post('/verify-email', authController.verifyEmail);
router.post('/login', authController.loginUser)
router.post('/logout', isAuth, authController.logoutUser)
router.get('/session', isAuth, authController.getCurrentUser)
router.post('/forgot-password', resendOtpLimiter, authController.forgotPassword);
// It's compulsory to send the email of the user in the body when someone is requesting an OTP at this route
router.post('/resend-password-reset', resendOtpLimiter, authController.resendPasswordResetEmail);
router.post('/reset-password', resendOtpLimiter, authController.resetPassword);


module.exports = router;