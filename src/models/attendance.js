const mongoose = require('mongoose');
const attendanceSchema = new mongoose.Schema({
    staffId: {
        type: String
    },
    attendanceDetails: {
        firstName: {
            type: String
        },
        lastName: {
            type: String
        },
        mobile: {
            type: String
        },
        addharNumber: {
            type: String
        },
        attendance: {
            type: String
        },
        month: {
            type: Number
        },
        year: {
            type: Number
        },
        date: {
            type: Number
        },  
        time: {
            type: String
        },

    },
    attendanceStatus: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
},
    { timestamps: true }
);

attendanceSchema.index({ staffId: 1 });
attendanceSchema.index({ "attendanceDetails.month": 1, "attendanceDetails.year": 1 });
attendanceSchema.index({ "attendanceDetails.date": 1, "attendanceDetails.month": 1, "attendanceDetails.year": 1 });
attendanceSchema.index({ createdAt: -1 });

const attendanceRecord = mongoose.model('attendance', attendanceSchema);
module.exports = {
    attendanceRecord
}