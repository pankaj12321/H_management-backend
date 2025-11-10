const mongoose = require("mongoose");

const TransectionUserRecordSchema = mongoose.Schema({
    transectionUserId: {
        type: String,
    },
    givenToAdmin: {
        type: [
            {
                Rs: { type: Number },
                updatedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        default: [], 
    },
    takenFromAdmin: {
        type: [
            {
                Rs: { type: Number },
                updatedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
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
