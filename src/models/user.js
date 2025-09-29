const { Schema, model, default: mongoose } = require("mongoose");
const { entityIdGenerator } = require("../utils/entityGenerator");

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    // mobile: {
    //   type: String,
    // },
    countryCode: {
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
    confirmPassword: {
      type: String,
    },
    profileImg:{
      type: String,
    },
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      enum: ["user", "teacher", "admin"],
      required: true,
    },
    status: {
      type: String,
      default: "Pending"
    },
    gender: {
      type: String,

    },
    language: {
      type: String
    },
    level: {
      type: String
    },
    QuranType: {
      type: String
    },
    AudioType: {
      type: String
    },
    Age: {
      type: Number
    },
    methodOfStudy: {
      type: [String],
      default: []
    },
     dailyTime: {
      type: String
    },
    teacherNo: {
      type: Number
    },
    completeProfile: {
      type: Boolean,
      default: false,
    },
    contact: {
      type: String
    },
    profileImg: String,
    emailVerification: {
      type: Boolean,
      default: false,
    },
    mobileVerification: {
      type: Boolean,
      default: false,
    },
    marital_status: {
      type: String,
      enum: ["single", "salaried", "divorced", "widowed", ""],
    },
    address: {
      addressLine1: String,
      street: String,
      city: String,
      district: String,
      state: String,
      pin_code: Number,
      houseNumber: String,
    },

    geoLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
        required: true,
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
        required: true,
      },
    },
    token: {
      type: String,
    },
    otp: {
      type: Number,
    },
    assigneeDetail: {
      teacherId: {
        type: String,
      },
      firstName: {
        type: String,
      },
      email: {
        type: String,
      },
    },
    profile: {
      type: String,
      default: "Active"
    }
  },
  { timestamps: true }
);

const User = model("User", userSchema);
module.exports = User;
