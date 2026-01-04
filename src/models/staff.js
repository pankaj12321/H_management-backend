const mongoose = require('mongoose');
const { entityIdGenerator } = require('../utils/entityGenerator');
const { create } = require('./admin');
const { Number } = require('twilio/lib/twiml/VoiceResponse');

const staffSchema = new mongoose.Schema({
    firstName: {
        type: String,
    },
    lastName: {
        type: String,
    },
    email: {
        type: String
    },
    mobile: {
        type: String,
    },
    staffId: {
        type: String,
        unique: true,
    },
    age: {
        type: Number,
    },
    branchName: {
        type: String,
    },
    salary: {
        type: Number
    },
    salaryHistory: [
        {
            salary: { type: Number },
            effectiveDate: { type: Date, default: Date.now }
        }
    ],
    gender: {
        type: String,
    },
    profileImage: {
        type: String,
    },
    IdProofImage: {
        type: String,
    },
    adharNumber: {
        type: String
    },
    DOB: {
        type: Date,
    },
    address: {
        city: {
            type: String,
        },
        state: {
            type: String,
        },
        country: {
            type: String,
        },
        pincode: {
            type: String,
        },
        street: {
            type: String,
        }
    },
    role: {
        type: String,
        default: "staff"
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },

},
    { timestamps: true }
)

const Staff = new mongoose.model('Staff', staffSchema);
module.exports = Staff;