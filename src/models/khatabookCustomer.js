const mongoose = require("mongoose");
const { MobileInstance } = require("twilio/lib/rest/api/v2010/account/availablePhoneNumberCountry/mobile");

const khatabookTransectionUserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String
    },

    city: {
        type: String,
    },
    State: {
        type: String,
    },

    khatabookUserId: {
        type: String
    },
    status: {
        type: String,

    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const khatabookTransectionUser = mongoose.model('khatabookTransectionUser', khatabookTransectionUserSchema);

module.exports = khatabookTransectionUser;
