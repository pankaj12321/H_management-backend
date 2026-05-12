const mongoose = require("mongoose");
const { entityIdGenerator } = require("../utils/entityGenerator");

const driverSchema = new mongoose.Schema(
  {
    driverId: {
      type: String,
    },
    name: {
      type: String,

    },
    carNumber: {
      type: String,
    },
    mobile: {
      type: String,
    },
    location: {
      type: String,
    },
    email: {
      type: String,
    },
    srNumber: {
      type: String,
      unique: true,
    },
    salary: {
      type: Number,
    },
    addedBy: {
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

driverSchema.index({ driverId: 1 });
driverSchema.index({ name: 1 });
driverSchema.index({ carNumber: 1 });
driverSchema.index({ mobile: 1 });
driverSchema.index({ createdAt: -1 });

const Driver = mongoose.model("Driver", driverSchema);
module.exports = Driver;