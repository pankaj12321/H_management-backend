require("dotenv").config();
const Admin = require("../models/admin");
const Driver = require("../models/driver");
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
const { hotelStaffCredential } = require('../constants/index');
const { json } = require("stream/consumers");

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

    const validAdmin = hotelStaffCredentials.find(
      (admin) =>
        admin.UserName === payload.UserName &&
        admin.HBranchName === payload.HBranchName
    );

    if (!validAdmin) {
      return res.status(401).json({ message: "Invalid username or branch" });
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
      const isMatch = await bcrypt.compare(
        payload.Password,
        findAdminInDB.Password
      );
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
        token: token
      },
    });
  } catch (err) {
    console.error("Error in Admin Login:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

const handleToAddTheDriverByAdmin = asyncHandler(async (req, res) => {
  try {
    const decoded = req.user;
    if (!decoded) {
      return res
        .status(403)
        .json({ message: "Forbidden! You are not authorized to add driver" });
    }
    const payload = req.body;
    if (!payload.name || !payload.carNumber || !payload.mobile || !payload.email || !payload.srNumber) {
      return res.status(400).json({ message: "Invalid Payload! All fields are required" });
    }
    const existingDriver = await Driver.findOne({ srNumber: payload.srNumber, name: payload.name });
    if (existingDriver) {
      return res.status(409).json({ message: "Driver already exists with this SR Number and Name" });
    }
    const newDriver = new Driver({
      driverId: entityIdGenerator("DRIVER"),
      name: payload.name,
      carNumber: payload.carNumber,
      mobile: payload.mobile,
      email: payload.email,
      srNumber: payload.srNumber,
      addedBy: decoded.user
    });
    await newDriver.save();
    res.status(201).json({ message: "Driver added successfully", driver: newDriver });

  }
  catch (err) {
    console.error("Error in Admin Login:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

const handleToGetAllDriversByAdmin = asyncHandler(async (req, res) => {
  try {
    const decoded = req.user;
    if (!decoded) {
      return res
        .status(403)
        .json({ message: "Forbidden! You are not authorized to view drivers" });
    }
    const query = req.query
    let matchQuery = {};
    if (query.name) {
      matchQuery.name = { $regex: query.name, $options: 'i' };
    }
    if (query.carNumber) {
      matchQuery.carNumber = { $regex: query.carNumber, $options: 'i' };
    }
    if (query.mobile) {
      matchQuery.mobile = { $regex: query.mobile, $options: 'i' };
    }
    if (query.srNumber) {
      matchQuery.srNumber = { $regex: query.srNumber, $options: 'i' };
    }
    if (query.email) {
      matchQuery.email = { $regex: query.email, $options: 'i' };
    }
    const drivers = await Driver.find(matchQuery).sort({ createdAt: -1 });

    if (!drivers || drivers.length === 0) {
      return res.status(200).json({ message: "No drivers found", drivers: [] });
    }
    res.status(200).json({ message: "Drivers fetched successfully", drivers: drivers });
  } catch (err) {
    console.error("Error in fetching drivers:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});



module.exports = {
  handleToLoginByAdmin,
  handleToAddTheDriverByAdmin,
  handleToGetAllDriversByAdmin
};
