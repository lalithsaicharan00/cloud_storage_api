
const isAuth = (req, res, next) => {
    if (req.session.userId) {
        next(); // If user is logged in, continue to the controller
    } else {
        res.status(401).json({ message: 'Unauthorized: You are not logged in.' });
    }
};
module.exports = isAuth;