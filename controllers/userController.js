const { User } = require('../models');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');
const { sendVerificationEmail, sendEmailChangeOtp } = require('../utils/emailSender');
const { generateOtp } = require('../utils/otpService');
const cloudinary = require('../config/cloudinary')

const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please provide all required fields.' });
        }


        const hashedPassword = await bcrypt.hash(password, 10);


        const { plainTextOtp, hashedOtp, otpExpiresAt } = generateOtp();



        const newUser = await User.create({
            uuid: uuidv4(),
            name,
            email,
            passwordHash: hashedPassword,
            verificationCode: hashedOtp,
            verificationCodeExpiresAt: otpExpiresAt
        });


        await sendVerificationEmail(newUser.email, plainTextOtp);


        res.status(201).json({
            message: 'Registration successful. Please check your email for a verification code.'
        });

    } catch (error) {

        if (error instanceof Sequelize.UniqueConstraintError) {
            return res.status(409).json({ message: 'An account with this email already exists.' });
        }
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'An internal server error occurred.' });
    }
};

const getUserProfile = async (req, res) => {
    try {
        // 1. Get the user's public UUID from the URL parameters.
        const { userId } = req.params;

        // 2. Find the user in the database using their UUID.
        const user = await User.findOne({
            where: {
                uuid: userId
            },
            // 3. CRITICAL: Select only the public-safe attributes.
            //    NEVER return the user's email, password hash, or internal IDs.
            attributes: ['uuid', 'name', 'profileImageUrl']
        });

        // 4. If no user is found with that UUID, send a 404 Not Found error.
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // 5. If the user is found, send their public profile data.
        res.status(200).json({ user });

    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'An internal server error occurred.' });
    }
};

const updateMyProfile = async (req, res) => {
    try {
        // 1. Get the user's ID from the session.
        const userId = req.session.userId;
        // Get the new name (if provided) from the request body.
        const { name } = req.body;
        // Get the new profile image file (if provided) from multer.
        const newProfileImage = req.file;

        // 2. Find the current user in the database.
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // This object will hold the fields we want to update.
        const updateData = {};

        // 3. Handle the profile image update.
        if (newProfileImage) {
            // If there's an old profile picture, delete it from Cloudinary first.
            if (user.profileImagePublicId) {
                await cloudinary.uploader.destroy(user.profileImagePublicId);
            }

            // Upload the new profile picture to Cloudinary from the memory buffer.
            const uploadResult = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: 'profile_pictures', resource_type: 'image' },
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result);
                    }
                );
                uploadStream.end(newProfileImage.buffer);
            });

            // Add the new image URL and public_id to our update object.
            updateData.profileImageUrl = uploadResult.secure_url;
            updateData.profileImagePublicId = uploadResult.public_id;
        }

        // 4. Handle the name update.
        if (name) {
            updateData.name = name;
        }

        // 5. Perform the update in the database.
        await user.update(updateData);

        // 6. Send back the updated, public-safe user profile.
        res.status(200).json({
            message: 'Profile updated successfully.',
            user: {
                uuid: user.uuid,
                name: user.name,
                email: user.email,
                profileImageUrl: user.profileImageUrl
            }
        });

    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'An internal server error occurred.' });
    }
};

const requestEmailChange = async (req, res) => {
    try {
        // 1. Get the new email and current password from the request body.
        const { newEmail, currentPassword } = req.body;
        // 2. Get the current user's ID securely from their session.
        const userId = req.session.userId;

        // 3. Validate input.
        if (!newEmail || !currentPassword) {
            return res.status(400).json({ message: 'New email and your current password are required.' });
        }

        // 4. Find the currently logged-in user.
        const user = await User.findByPk(userId);
        if (!user) {
            // This is unlikely if they are logged in, but a good safety check.
            return res.status(404).json({ message: 'User not found.' });
        }

        // 5. Security Check: Verify the user's current password.
        const isPasswordMatch = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isPasswordMatch) {
            return res.status(401).json({ message: 'Incorrect password.' });
        }

        // 6. Check if the new email is already in use by another account.
        const emailExists = await User.findOne({ where: { email: newEmail } });
        if (emailExists) {
            return res.status(409).json({ message: 'This email is already in use by another account.' });
        }

        // 7. Use our reusable service to generate a new OTP.
        const { plainTextOtp, hashedOtp, otpExpiresAt } = generateOtp();

        // 8. Update the user's record with the pending email and the new code.
        await user.update({
            pendingEmail: newEmail,
            emailChangeCode: hashedOtp,
            emailChangeExpiresAt: otpExpiresAt
        });

        // 9. Send the verification email to the NEW email address.
        await sendEmailChangeOtp(newEmail, plainTextOtp);

        // 10. Send a success response.
        res.status(200).json({ message: 'A verification code has been sent to your new email address. Please check your inbox to confirm the change.' });

    } catch (error) {
        console.error('Error requesting email change:', error);
        res.status(500).json({ message: 'An internal server error occurred.' });
    }
};

const resendEmailChangeCode = async (req, res) => {
    try {
        // 1. Get the user's ID securely from their session.
        const userId = req.session.userId;

        // 2. Find the user in the database.
        const user = await User.findByPk(userId);

        // 3. Business Logic: Check if there is actually an email change pending.
        if (!user.pendingEmail) {
            return res.status(400).json({ message: 'There is no pending email change request for this account.' });
        }

        // 4. Business Logic: Check if a valid, unexpired code was already sent recently.
        if (user.emailChangeCode && user.emailChangeExpiresAt > new Date()) {
            return res.status(429).json({ message: 'A valid verification code was sent recently. Please wait for it to expire before requesting a new one.' });
        }

        // 5. If all checks pass, use our reusable service to generate a new OTP.
        const { plainTextOtp, hashedOtp, otpExpiresAt } = generateOtp();

        // 6. Update the user's record with the new code and expiration time.
        await user.update({
            emailChangeCode: hashedOtp,
            emailChangeExpiresAt: otpExpiresAt
        });

        // 7. Send the new verification email to the PENDING email address.
        await sendEmailChangeOtp(user.pendingEmail, plainTextOtp);

        // 8. Send a success response.
        res.status(200).json({ message: 'A new verification code has been sent to your pending email address.' });

    } catch (error) {
        console.error('Error resending email change code:', error);
        res.status(500).json({ message: 'An internal server error occurred.' });
    }
};


const verifyEmailChange = async (req, res) => {
    try {
        // 1. Get the OTP from the request body and the user ID from the session.
        const { otp } = req.body;
        const userId = req.session.userId;

        // 2. Validate input.
        if (!otp) {
            return res.status(400).json({ message: 'Verification code is required.' });
        }

        // 3. Find the currently logged-in user.
        const user = await User.findByPk(userId);

        // 4. Perform security and logic checks.
        // Check if there is actually an email change pending.
        if (!user.pendingEmail || !user.emailChangeCode) {
            return res.status(400).json({ message: 'No pending email change found for this account.' });
        }

        // Check if the OTP has expired.
        if (user.emailChangeExpiresAt < new Date()) {
            return res.status(400).json({ message: 'Your verification code has expired. Please request a new one.' });
        }

        // Securely compare the submitted OTP with the stored hash.
        const isOtpMatch = await bcrypt.compare(otp, user.emailChangeCode);
        if (!isOtpMatch) {
            return res.status(400).json({ message: 'Invalid verification code.' });
        }

        // 5. If all checks pass, perform the final update.
        //    Atomically update the email and clear all temporary fields.
        const updatedUser = await user.update({
            email: user.pendingEmail,
            pendingEmail: null,
            emailChangeCode: null,
            emailChangeExpiresAt: null
        });

        // 6. Send a successful response with the updated (safe) user data.
        res.status(200).json({
            message: 'Your email address has been successfully updated.',
            user: {
                uuid: updatedUser.uuid,
                name: updatedUser.name,
                email: updatedUser.email,
                profileImageUrl: updatedUser.profileImageUrl
            }
        });

    } catch (error) {
        console.error('Error verifying email change:', error);
        res.status(500).json({ message: 'An internal server error occurred.' });
    }
};



const deleteUserAccount = async (req, res) => {
    try {
        const userId = req.session.userId;
        // ... find user ...

        // --- NEW, ROBUST CLEANUP LOGIC ---
        // Find all files belonging to the user.
        const userFiles = await File.findAll({ where: { userId: userId } });

        if (userFiles.length > 0) {
            // Extract the RELIABLE public_id from each database record.
            const publicIds = userFiles.map(file => file.publicId);

            // Delete all the user's files from Cloudinary using their correct IDs.
            await cloudinary.api.delete_resources(publicIds);
        }
        // --- END OF NEW LOGIC ---

        // The rest of the function remains the same...
        await user.destroy();
        req.session.destroy(err => {
            // ...
            res.status(200).json({ message: 'Your account has been permanently deleted.' });
        });

    } catch (error) {
        console.error('Error deleting user account:', error);
        res.status(500).json({ message: 'An internal server error occurred.' });
    }
};

module.exports = {
    registerUser,
    getUserProfile,
    updateMyProfile,
    requestEmailChange,
    resendEmailChangeCode,
    verifyEmailChange,
    deleteUserAccount
};