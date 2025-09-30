require("dotenv").config();
const Admin = require("../models/admin");

const asyncHandler = require("express-async-handler");
const { sendEmail, sendSms } = require("../services/service");
const jwt = require("jsonwebtoken");
const { createTokenHandler } = require("../services/authToken");
const { deleteToken } = require("../middleware/verifyToken");
const { entityIdGenerator } = require("../utils/entityGenerator")
const redisClient = require("../config/redis");
const bcrypt = require('bcrypt')
const otpStore = new Map();
const crypto = require("crypto");
const {hotelStaffCredential} = require('../constants/index');

const hotelStaffCredentials = [
  {
    id: 1,
    UserName: "HMSAdmin123",
    Password: "HMSAdmin@123",
    HBranchName: "HMSAdminBranch",
  },
  {
    id: 2,
    UserName: "HMSManager01",
    Password: "HMSManager@321",
    HBranchName: "HMSMainBranch",
  },
  {
    id: 3,
    UserName: "HMSReception9",
    Password: "HMSRecp#987",
    HBranchName: "HMSDowntownBranch",
  },
];

const handleToLoginByAdmin = asyncHandler(async (req, res) => {
  try {
    const payload = req.body;

    if (!payload.UserName || !payload.Password || !payload.HBranchName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // check static credentials first
    const validAdmin = hotelStaffCredentials.find(
      (admin) =>
        admin.UserName === payload.UserName &&
        admin.HBranchName === payload.HBranchName
    );

    if (!validAdmin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    let findAdminInDB = await Admin.findOne({
      UserName: payload.UserName,
      HBranchName: payload.HBranchName,
    });

    if (!findAdminInDB) {
      const hashedPassword = await bcrypt.hash(payload.Password, 10);

      findAdminInDB = new Admin({
        adminId: entityIdGenerator("ADMIN"),
        UserName: payload.UserName,
        Password: hashedPassword,
        HBranchName: payload.HBranchName,
      });
      await findAdminInDB.save();
    } else {
      const isMatch = await bcrypt.compare(payload.Password, findAdminInDB.Password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid password" });
      }
    }

    const token = jwt.sign(
      {
        id: findAdminInDB._id,
        user: findAdminInDB.UserName,
        branch: findAdminInDB.HBranchName,
        role: "admin",
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Login successful",
      user: {
        UserName: findAdminInDB.UserName,
        HBranchName: findAdminInDB.HBranchName,
        role: "admin",
      },
      token: token,
    });
  } catch (err) {
    console.error("Error in Admin Login:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});



module.exports = { handleToLoginByAdmin };
