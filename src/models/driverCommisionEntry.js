const mongoose = require("mongoose");
const { entityIdGenerator } = require("../utils/entityGenerator");

const driverCommisionEntrySchema = new mongoose.Schema(
  {
    entryId: {
      type: String,
    },
    driverId: {
      type: String,
    },
    driverName: {
      type: String,

    },
    carNumber: {
      type: String,
    },
    mobile: {
      type: String,
    },
    srNumber: {
      type: String,
    },
    driverCommisionAmount: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
    },
    branchName: {
      type: String,
    },
    partyAmount: {
      type: Number,
      default: 0,
    },
    foodTaken: {
      type: Boolean,
    },
    status: {
      type: String,
    },
    entryDate: {
      type: Date,
      default: Date.now,
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

driverCommisionEntrySchema.index({ entryId: 1 });
driverCommisionEntrySchema.index({ driverId: 1 });
driverCommisionEntrySchema.index({ status: 1 });
driverCommisionEntrySchema.index({ entryDate: -1 });
driverCommisionEntrySchema.index({ createdAt: -1 });
const DriverCommisionEntry = mongoose.model("DriverCommisionEntry", driverCommisionEntrySchema);
module.exports = DriverCommisionEntry;