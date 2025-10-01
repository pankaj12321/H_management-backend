const mongoose = require("mongoose");
const { entityIdGenerator } = require("../utils/entityGenerator");

const driverCommisionEntrySchema = new mongoose.Schema(
  {
    entryId: {
      type: String,
    },
    driverId: {
        type:String,
    },
    driverName:{
        type:String,
        
    },
    carNumber:{
        type:String,
    },
    mobile:{
        type:String,
    },
    srNumber:{
        type:String,
    },
    driverCommisionAmount:{
        type:Number,
        default:0,
    },
    partyAmount:{
        type:Number,
        default:0,
    },
    status:{
        type:String,
    },
    entryDate:{
        type:Date,
        default:Date.now,
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
const DriverCommisionEntry = mongoose.model("DriverCommisionEntry", driverCommisionEntrySchema);
module.exports = DriverCommisionEntry;