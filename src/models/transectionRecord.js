const mongoose = require("mongoose");

const transactionItemSchema = new mongoose.Schema({
    Rs: { type: Number },
    paymentMode: { 
        type: String, 
        enum: ["cash", "online"], 
    },
    discription:{
        type: String 
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    }
});

const TransectionUserRecordSchema = mongoose.Schema({
    transectionUserId: {
        type: String,
    },

    givenToAdmin: {
        type: [transactionItemSchema],
        default: [],
    },

    takenFromAdmin: {
        type: [transactionItemSchema],
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

const TransectionUserRecord = mongoose.model('TransectionUserRecord', TransectionUserRecordSchema);
module.exports = TransectionUserRecord;
