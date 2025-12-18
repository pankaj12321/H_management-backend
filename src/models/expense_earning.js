const mongoose = require('mongoose');
const expenseSchema = new mongoose.Schema({
    expenseId: {
        type: String,
    },
    expenseAmount: {
        type: Number,
        required: true,
    },
    expenceItems: {
        type: [String]
    },
    paymentScreenshoot: {
        type: String
    },
    expenseDate: {
        type: Date,
        default: new Date()
    },
    paymentMode: {
        type: String,
        default: "cash"
    },
    billno: {
        type: Number
    },
    dateTime: {
        type: Date,
        default: new Date()
    },
    description: {
        type: String
    }


}, { timestamp: true })

const Expense = mongoose.model('Expense', expenseSchema);

const earningSchema = new mongoose.Schema({
    eariningId: {
        type: String,
    },
    earningAmount: {
        type: Number,
        required: true,
    },
    earningDetails: {
        type: [String]
    },
    earningDate: {
        type: Date,
    },
    paymentScreenshoot: {
        type: String
    },
    paymentMode: {
        type: String,
        default: "cash"
    },
    billno: {
        type: Number
    },
    dateTime: {
        type: Date,
    },
    description: {
        type: String
    }
}, { timestamp: true })

const Earning = mongoose.model('earning', earningSchema)


module.exports = {
    Expense,
    Earning,

};