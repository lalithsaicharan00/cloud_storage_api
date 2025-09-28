const formData = require('form-data');
const Mailgun = require('mailgun.js');

// 1. Initialize the Mailgun client
const mailgun = new Mailgun(formData);
const mg = mailgun.client({
    username: 'api',
    key: process.env.MAILGUN_API_KEY,
});


const sendVerificationEmail = async (toEmail, otp) => {
    const emailData = {
        from: `Excited User <mailgun@${process.env.MAILGUN_DOMAIN}>`,
        to: [toEmail],
        subject: 'Verify Your Email Address',
        text: `Welcome! Your verification code is: ${otp}. It will expire in 10 minutes.`,
        html: `<h3>Welcome!</h3><p>Your verification code is: <strong>${otp}</strong></p><p>It will expire in 10 minutes.</p>`
    };

    try {
        const response = await mg.messages.create(process.env.MAILGUN_DOMAIN, emailData);
        console.log('Email sent successfully:', response);
    } catch (error) {
        console.error('Error sending email:', error);
        // In a real app, you might want to throw the error to be handled
        // by the controller that called this function.
    }
};

const sendPasswordResetEmail = async (toEmail, otp) => {
    const emailData = {
        from: `Support <mailgun@${process.env.MAILGUN_DOMAIN}>`,
        to: [toEmail],
        subject: 'Your Password Reset Code',
        text: `You requested a password reset. Your code is: ${otp}. It will expire in 10 minutes.`,
        html: `<h3>Password Reset Request</h3><p>Your password reset code is: <strong>${otp}</strong></p><p>It will expire in 10 minutes. If you did not request this, you can safely ignore this email.</p>`
    };

    try {
        const response = await mg.messages.create(process.env.MAILGUN_DOMAIN, emailData);
        console.log('Password reset email sent successfully:', response);
    } catch (error) {
        console.error('Error sending password reset email:', error);
    }
};


const sendEmailChangeOtp = async (toEmail, otp) => {
    const emailData = {
        from: `Account Security <mailgun@${process.env.MAILGUN_DOMAIN}>`,
        to: [toEmail],
        subject: 'Confirm Your New Email Address',
        text: `You requested to change your email address. Your verification code is: ${otp}. It will expire in 10 minutes.`,
        html: `<h3>Confirm Your New Email</h3><p>Your verification code is: <strong>${otp}</strong></p><p>It will expire in 10 minutes. If you did not request this, please contact our support team immediately.</p>`
    };

    try {
        const response = await mg.messages.create(process.env.MAILGUN_DOMAIN, emailData);
        console.log('Email change OTP sent successfully:', response);
    } catch (error) {
        console.error('Error sending email change OTP:', error);
    }
};


module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendEmailChangeOtp
};