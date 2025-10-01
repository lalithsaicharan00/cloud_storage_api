const { User } = require('../models');
const bcrypt = require('bcryptjs');
const { generateOtp } = require('../utils/otpService');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailSender');




const resendVerificationEmail = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required.' });
        }

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(200).json({ message: 'If an account with this email exists, a new verification code has been sent.' });
        }

        if (user.emailVerified) {
            return res.status(400).json({ message: 'This account has already been verified.' });
        }

        if (user.verificationCode && user.verificationCodeExpiresAt > new Date()) {
            return res.status(429).json({ message: 'A valid verification code was sent recently. Please check your email or wait for it to expire.' });
        }

        // --- 2. Use the OTP service ---
        // This single line replaces the manual generation and hashing logic.
        const { plainTextOtp, hashedOtp, otpExpiresAt } = generateOtp();
        // ----------------------------

        // Update the user's record with the new code from the service.
        await user.update({
            verificationCode: hashedOtp,
            verificationCodeExpiresAt: otpExpiresAt
        });

        // Send the new code to the user's email.
        await sendVerificationEmail(user.email, plainTextOtp);

        res.status(200).json({ message: 'If an account with this email exists, a new verification code has been sent.' });

    } catch (error) {
        console.error('Error resending verification email:', error);
        res.status(500).json({ message: 'An internal server error occurred.' });
    }
};

const verifyEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // 1. Validate that both email and OTP were provided.
        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required.' });
        }

        // 2. Find the user by their email address.
        const user = await User.findOne({ where: { email } });

        if (!user) {
            // Security: Keep the error generic.
            return res.status(400).json({ message: 'Invalid verification code or email.' });
        }

        // 3. Business Logic: Check if the user's account is already verified.
        if (user.emailVerified) {
            return res.status(400).json({ message: 'This account has already been verified.' });
        }

        // 4. Business Logic: Check if the OTP has expired.
        if (user.verificationCodeExpiresAt < new Date()) {
            return res.status(400).json({ message: 'Your verification code has expired. Please request a new one.' });
        }

        // 5. Securely compare the submitted OTP with the hashed OTP in the database.
        const isOtpMatch = await bcrypt.compare(otp, user.verificationCode);

        if (!isOtpMatch) {
            return res.status(400).json({ message: 'Invalid verification code or email.' });
        }

        // 6. If all checks pass, update the user's record to mark them as verified.
        //    We also clear out the verification code fields for security and cleanliness.
        await user.update({
            emailVerified: true,
            verificationCode: null,
            verificationCodeExpiresAt: null
        });

        // 7. Send a final success response.
        res.status(200).json({ message: 'Email verified successfully. You may now log in.' });

    } catch (error) {
        console.error('Error during email verification:', error);
        res.status(500).json({ message: 'An internal server error occurred.' });
    }
};


// this will login and create session

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide both an email and a password.' });
        }

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!user.emailVerified) {
            return res.status(403).json({ message: 'Your account has not been verified. Please check your email.' });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        req.session.userId = user.userId;
        req.session.userUuid = user.uuid;

        res.status(200).json({
            message: 'Login successful!',
            user: {
                name: user.name,
                email: user.email,
                profileImageUrl: user.profileImageUrl
            }
        });

    } catch (error) {
        console.error('An unexpected error occurred during login:', error);
        res.status(500).json({ message: 'An internal server error occurred.' });
    }
};

// this will logout and destroy session, clear cookie as well 

const logoutUser = (req, res) => {

    req.session.destroy(err => {

        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ message: 'Could not log out, please try again.' });
        }

        res.clearCookie('connect.sid');

        res.status(200).json({ message: 'You have been successfully logged out.' });
    });
};

// this will return user profile info 

const getCurrentUser = async (req, res) => {
    try {

        const userId = req.session.userId;

        const user = await User.findByPk(userId, {
            attributes: ['uuid', 'name', 'email', 'profileImageUrl']
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json({ user });

    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'An internal server error occurred.' });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required.' });
        }

        const user = await User.findOne({ where: { email } });

        // Security Rule #1: To prevent email enumeration, always send a generic success response.
        // Also, only allow password resets for VERIFIED accounts.
        if (!user || !user.emailVerified) {
            return res.status(200).json({ message: 'If an account with that email exists and is verified, a password reset code has been sent.' });
        }

        // Security Rule #2: Check if a valid reset code was sent recently.
        if (user.passwordResetCode && user.passwordResetExpiresAt > new Date()) {
            return res.status(429).json({ message: 'A password reset code was sent recently. Please check your email or wait for it to expire.' });
        }

        // Use our reusable service to generate a new OTP
        const { plainTextOtp, hashedOtp, otpExpiresAt } = generateOtp();

        // Update the user's record with the new password reset code in the dedicated columns
        await user.update({
            passwordResetCode: hashedOtp,
            passwordResetExpiresAt: otpExpiresAt
        });

        // Send the password reset email
        await sendPasswordResetEmail(user.email, plainTextOtp);

        // Send the final generic success response
        res.status(200).json({ message: 'If an account with that email exists and is verified, a password reset code has been sent.' });

    } catch (error) {
        console.error('Error in forgot password flow:', error);
        res.status(500).json({ message: 'An internal server error occurred.' });
    }
};

const resendPasswordResetEmail = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required.' });
        }

        const user = await User.findOne({ where: { email } });

        // Security Rule #1: To prevent discovering registered emails, always send a generic success response.
        // Also, only allow resets for VERIFIED accounts.
        if (!user || !user.emailVerified) {
            return res.status(200).json({ message: 'If a verified account with that email exists, a new password reset code has been sent.' });
        }

        // Security Rule #2: Check if a valid, unexpired reset code was already sent recently.
        if (user.passwordResetCode && user.passwordResetExpiresAt > new Date()) {
            return res.status(429).json({ message: 'A password reset code was sent recently. Please check your email or wait for it to expire.' });
        }

        // If all checks pass, generate a new OTP using our reusable service.
        const { plainTextOtp, hashedOtp, otpExpiresAt } = generateOtp();

        // Update the user's record with the new code in the dedicated password reset columns.
        await user.update({
            passwordResetCode: hashedOtp,
            passwordResetExpiresAt: otpExpiresAt
        });

        // Send the new password reset email.
        await sendPasswordResetEmail(user.email, plainTextOtp);

        // Send the final generic success response.
        res.status(200).json({ message: 'If a verified account with that email exists, a new password reset code has been sent.' });

    } catch (error) {
        console.error('Error in resend password reset flow:', error);
        res.status(500).json({ message: 'An internal server error occurred.' });
    }
};


const resetPassword = async (req, res) => {
    try {
        // 1. Get all necessary data from the request body.
        const { email, otp, newPassword } = req.body;

        // 2. Validate input.
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: 'Email, OTP, and a new password are required.' });
        }

        // 3. Find the user by their email.
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(400).json({ message: 'Invalid OTP or email.' });
        }

        // 4. Check if the password reset code has expired.
        if (user.passwordResetExpiresAt < new Date()) {
            return res.status(400).json({ message: 'Your password reset code has expired. Please request a new one.' });
        }

        // 5. Securely compare the submitted OTP with the hash in the database.
        const isOtpMatch = await bcrypt.compare(otp, user.passwordResetCode);

        if (!isOtpMatch) {
            return res.status(400).json({ message: 'Invalid OTP or email.' });
        }

        // 6. If all checks pass, hash the new password.
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // 7. Update the user's record with the new password and clear the reset code fields.
        //    This ensures the OTP cannot be used again.
        await user.update({
            passwordHash: hashedNewPassword,
            passwordResetCode: null,
            passwordResetExpiresAt: null
        });

        // 8. Send a final success response.
        res.status(200).json({ message: 'Password has been reset successfully. You may now log in.' });

    } catch (error) {
        console.error('Error during password reset:', error);
        res.status(500).json({ message: 'An internal server error occurred.' });
    }
};



module.exports = {
    resendVerificationEmail,
    verifyEmail,
    loginUser,
    logoutUser,
    getCurrentUser,
    forgotPassword,
    resendPasswordResetEmail,
    resetPassword
};
