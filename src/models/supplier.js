const mongoose = require("mongoose");
const supplierSchema = new mongoose.Schema({
    supplierId: {
        type: String,
    },
    supplierName: {
        type: String,
    },
    supplierEmail: {
        type: String,
    },
    supplierPhone: {
        type: String,
    },
    supplierCompany: {
        type: String,
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

supplierSchema.index({ supplierId: 1 });
supplierSchema.index({ supplierName: 1 });
supplierSchema.index({ supplierPhone: 1 });
supplierSchema.index({ createdAt: -1 });

const Supplier = mongoose.model('Supplier', supplierSchema);
module.exports = Supplier;
