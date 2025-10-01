
const bcrypt = require('bcryptjs');


function generateOtp() {
    const plainTextOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = bcrypt.genSaltSync(10); // Use sync for simplicity in this helper
    const hashedOtp = bcrypt.hashSync(plainTextOtp, salt);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    return { plainTextOtp, hashedOtp, otpExpiresAt };
}

module.exports = { generateOtp };