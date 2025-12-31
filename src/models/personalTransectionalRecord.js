const mongoose = require("mongoose");

const personalTransactionalItemSchema = new mongoose.Schema({
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
    updatedAt: {
        type: Date,
        default: Date.now,
    }
});

const personalTransectionUserRecordSchema = mongoose.Schema({
    personalTransectionalUserId: {
        type: String,
    },

    givenToAdmin: {
        type: [personalTransactionalItemSchema],
        default: [],
    },

    takenFromAdmin: {
        type: [personalTransactionalItemSchema],
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

const personalTransectionUserRecord = mongoose.model('personalTransectionUserRecord', personalTransectionUserRecordSchema);
module.exports = personalTransectionUserRecord;
