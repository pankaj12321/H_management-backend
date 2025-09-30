const mongoose = require("mongoose");
const { entityIdGenerator } = require("../utils/entityGenerator");

const driverSchema = new mongoose.Schema(
  {
    driverId: {
      type: String,
    },
    name:{
        type:String,
        
    },
    carNumber:{
        type:String,
    },
    mobile:{
        type:String,
        unique:true,
    },
    srNumber:{
        type:String,
        unique:true,
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

const Driver = mongoose.model("Driver", driverSchema);
module.exports = Driver;