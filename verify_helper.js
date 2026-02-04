const mongoose = require('mongoose');
const Staff = require('./src/models/staff');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const generateToken = () => {
    return jwt.sign({ role: 'admin', id: 'verification_admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        const staff = await Staff.findOne();
        if (!staff) {
            console.log("No staff found in database.");
        } else {
            const token = generateToken();
            console.log("STAFF_ID=" + staff.staffId);
            console.log("AUTH_TOKEN=" + token);
            console.log("PORT=" + process.env.PORT);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
});
