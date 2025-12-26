const mongoose = require("mongoose");

const personalTransectionRecordSchema = new mongoose.Schema({
    Rs: { type: Number },
    paymentMode: {
        type: String,
        enum: ["cash", "online"],
    },
    description: {
        type: String
    },
    paymentScreenshoot: {
        type: String
    },
    billno: {
        type: Number
    },
    returnDate: {
        type: Date
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    }
});

const personalCustomerTransectionRecordSchema = mongoose.Schema({
    personalCustomerRecordTranId: {
        type: String,
    },

    givenToAdmin: {
        type: [personalTransectionRecordSchema],
        default: [],
    },

    takenFromAdmin: {
        type: [personalTransectionRecordSchema],
        default: [],
    },

    totalTaken: {
        type: Number,
        default: 0,
    },

    totalGiven: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });

const personalCustomerTransectionRecord = mongoose.model('personalCustomerTransectionRecord', personalCustomerTransectionRecordSchema);
module.exports = personalCustomerTransectionRecord;
