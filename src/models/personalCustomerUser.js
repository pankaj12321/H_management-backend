const mongoose = require("mongoose");

const personalCustomerRecordTranSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    personalCustomerRecordTranId: {
        type: String,
    },
    email: {
        type: String,
    },
    mobile: {
        type: String,

    },
    profileImg:{
        type:String

    },
    city: {
        type: String,
    },
    state: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now
    },


});

const personalCustomerRecordTran = new mongoose.model("personalCustomerRecordTran", personalCustomerRecordTranSchema);
module.exports = { personalCustomerRecordTran }