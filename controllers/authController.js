const { User } = require('../models');
const bcrypt = require('bcryptjs');

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


module.exports = {
    loginUser,
    logoutUser,
    getCurrentUser
};
