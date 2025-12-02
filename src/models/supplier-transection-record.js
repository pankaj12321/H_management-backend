const mongoose = require("mongoose");

const supplierTxnItemSchema = new mongoose.Schema({
    Rs: { type: Number },
    paymentMode: {
        type: String,
        enum: ["cash", "online"],
    },
    discription: {
        type: String
    },
    paymentScreenshoot: {
        type: String   
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    }
});

const supplierTransactionRecordSchema = new mongoose.Schema({
    supplierId: {
        type: String,
    },

    givenToAdmin: {
        type: [supplierTxnItemSchema],
        default: [],
    },

    takenFromAdmin: {
        type: [supplierTxnItemSchema],
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


const SupplierTransactionRecord = mongoose.model(
    'SupplierTransactionRecord',
    supplierTransactionRecordSchema
);

module.exports = SupplierTransactionRecord;
