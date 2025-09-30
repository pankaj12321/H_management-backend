const { Schema, model, default: mongoose } = require("mongoose");
const { entityIdGenerator } = require("../utils/entityGenerator");

const adminSchema = new Schema(
  {
      adminId:{
        type:String,
      },
      UserName: {
        type: String,
        required: true,
        unique: true,
      },
      Password: {
        type: String,
        required: true,
      },
      HBranchName: {
        type: String,
        required: true,
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

const Admin = model("admin", adminSchema);
module.exports = Admin;
