const rateLimit = require('express-rate-limit');


const resendOtpLimiter = rateLimit({

    windowMs: 10 * 60 * 1000,
    max: 5,
    message: {
        message: 'Too many requests to resend OTP from this IP, please try again after 10 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = resendOtpLimiter;