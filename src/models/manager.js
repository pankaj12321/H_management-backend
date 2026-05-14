const { Schema, model } = require("mongoose");

const managerSchema = new Schema(
  {
    managerId: {
      type: String,
      unique: true,
    },
    managerName: {
      type: String,
      required: true,
    },
    mobileNumber: {
      type: String,
      required: true,
      unique: true,
    },
    UserName: {
      type: String,
      required: true,
    },
    Password: {
      type: String,
      required: true,
    },
    HBranchName: {
      type: String,
      required: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      default: "manager",
    },
  },
  { timestamps: true }
);

const Manager = model("manager", managerSchema);
module.exports = Manager;
