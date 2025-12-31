const mongoose = require("mongoose");

const personalCustomerEntriesSchema = new mongoose.Schema({
    personalCustomerRecordTranId: {
        type: String
    },
    personalCustomerEntryId: {
        type: String
    },
    billAmount: {
        type: Number
    },
    amountPaidAfterDiscount: {
        type: Number
    },
    paymentMode: {
        type: String,
        enum: ["cash", "online", "cheque"]
    },
    paymentScreenshoot: {
        type: String
    },
    description: {
        type: String
    },
    status: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }

});

const personalCustomerEntries = mongoose.model('personalCustomerEntries', personalCustomerEntriesSchema);
module.exports = personalCustomerEntries;