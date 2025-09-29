const User = require("../models/user");
const asyncHandler = require("express-async-handler");
const { sendEmail, sendSms } = require("../services/service");
const jwt = require("jsonwebtoken");
const { createTokenHandler } = require("../services/authToken");
const { deleteToken } = require("../middleware/verifyToken");
const { entityIdGenerator } = require("../utils/entityGenerator")
const redisClient = require("../config/redis");
const otp = require("../models/otp");
const bcrypt = require('bcrypt')
const otpStore = new Map();


const handleRegisterUser = asyncHandler(async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    password,
    confirmPassword,
    role,
    address
  } = req.body;

  if (!firstName || !lastName || !email || !confirmPassword || !password || !role) {
    const error = new Error(
      "Missing required fields: name, email, mobile, gender, password, or address.city"
    );
    error.statusCode = 400;
    return next(error);
  }
  if (confirmPassword !== password) {
    const error = new Error("incorrect password");
    error.statusCode = 409;
    return next(error);
  }

  const existingUserEmail = await User.findOne({ email });
  const existingTeacherEmail = await Teacher.findOne({ email });

  if (existingUserEmail || existingTeacherEmail) {
    const error = new Error("Email is already registered with another account!");
    error.statusCode = 409;
    return next(error);
  }


  try {
    let newUser;
    let idKey;
    const hashedPassword = await bcrypt.hash(password, 10);

    const commonData = {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      confirmPassword: confirmPassword,
      address: {
        addressLine1: address?.addressLine1 || "",
        street: address?.street || "",
        city: address?.city || "",
        district: address?.district || "",
        state: address?.state || "",
        pin_code: address?.pin_code || null,
        houseNumber: address?.houseNumber || "",
      },
      createdAt: new Date(),
      geoLocation: {
        type: "Point",
        coordinates: [0, 0],
      },
    };

    if (role === "teacher") {
      const teacherId = entityIdGenerator("TC");
      newUser = await Teacher.create({ ...commonData, teacherId });
      idKey = { teacherId: newUser.teacherId };
    } else if (role === "user") {
      const userId = entityIdGenerator("US");
      newUser = await User.create({ ...commonData, userId });
      idKey = { userId: newUser.userId };
    } else {
      const error = new Error("Invalid role provided!");
      error.statusCode = 400;
      return next(error);
    }

    return res.status(201).json({
      message: `${role} registered successfully`,
      data: {
        _id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        password: newUser.password,
        confirmPassword: newUser.confirmPassword,
        email: newUser.email,
        role: newUser.role,
        ...idKey,
        address: newUser.address,
        createdAt: newUser.createdAt,
      },
    });
  } catch (err) {
    console.error("Registration Error:", err);
    const error = new Error(
      err.message || "Something went wrong during registration"
    );
    error.statusCode = 500;
    return next(error);
  }
});


module.exports = {
  handleRegisterUser,
};