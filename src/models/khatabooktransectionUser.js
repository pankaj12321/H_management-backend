const mongoose = require("mongoose");

const khatabookTransactionItemSchema = new mongoose.Schema({
    Rs: { type: Number },
    paymentMode: {
        type: String,
        enum: ["cash", "online", "cheque"],
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
    hotelBranchName: {
        type: String,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    }
});

const khatabookTransectionUserRecordSchema = mongoose.Schema({
    khatabookUserId: {
        type: String,
    },

    givenToAdmin: {
        type: [khatabookTransactionItemSchema],
        default: [],
    },

    takenFromAdmin: {
        type: [khatabookTransactionItemSchema],
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

const khatabookTransectionUserRecord = mongoose.model('khatabookTransectionUserRecord', khatabookTransectionUserRecordSchema);
module.exports = khatabookTransectionUserRecord;
