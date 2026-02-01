const mongoose = require("mongoose");
const { MobileInstance } = require("twilio/lib/rest/api/v2010/account/availablePhoneNumberCountry/mobile");

const transactionalUserSchema = new mongoose.Schema({
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
    address: {
        City: {
            type: String,
        },
        State: {
            type: String,
        }
    },
    transectionUserId: {
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

const TransactionalUser = mongoose.model('TransactionalUser', transactionalUserSchema);

module.exports = TransactionalUser;
