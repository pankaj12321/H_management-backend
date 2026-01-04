const mongoose = require("mongoose");

const staffKhatabookItemSchema = new mongoose.Schema({
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

const staffKhatabookTransectionRecordSchema = mongoose.Schema({
    staffId: {
        type: String,
        required: true,
        unique: true
    },

    givenToAdmin: {
        type: [staffKhatabookItemSchema],
        default: [],
    },

    takenFromAdmin: {
        type: [staffKhatabookItemSchema],
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

const StaffKhatabook = mongoose.model('StaffKhatabook', staffKhatabookTransectionRecordSchema);
module.exports = StaffKhatabook;
