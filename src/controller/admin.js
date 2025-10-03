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
const DriverCommisionEntry = require("../models/driverCommisionEntry");

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
    const { UserName, Password, HBranchName } = req.body;

    if (!UserName || !Password || !HBranchName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const validAdmin = hotelStaffCredentials.find(
      (admin) =>
        admin.UserName === UserName &&
        admin.Password === Password &&
        admin.HBranchName === HBranchName
    );

    if (!validAdmin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    let findAdminInDB = await Admin.findOne({
      UserName,
      HBranchName,
    });

    if (!findAdminInDB) {
      findAdminInDB = new Admin({
        adminId: entityIdGenerator("ADMIN"),
        UserName,
        Password,
        HBranchName,
      });
      await findAdminInDB.save();
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
        token: token,
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
    if (!payload.name || !payload.carNumber || !payload.mobile || !payload.srNumber) {
      return res.status(400).json({ message: "Invalid Payload! All fields are required" });
    }
    const existingDriver = await Driver.findOne({ srNumber: payload.srNumber });
    if (existingDriver) {
      return res.status(409).json({ message: "Driver already exists with this SR Number" });
    }
    if (!existingDriver) {
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
    else {
      res.status(500).json({ message: "Something went wrong! Please try again later." });
    }

  }
  catch (err) {
    console.error("Error in for adding drivers by admin:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

const handleToEditTheDriverProfileByAdmin = asyncHandler(async (req, res) => {
  try{
    const decoded = req.user;
    if (!decoded) {
      return res
        .status(403)
        .json({ message: "Forbidden! You are not authorized to edit driver profile" });
    }
    const { driverId, name, carNumber, mobile , srNumber } = req.body;
    if (!driverId) {
      return res.status(400).json({ message: "driverId is required" });
    }

    const driverDetails = await Driver.findOne({ driverId });
    if (!driverDetails) {
      return res.status(404).json({ message: "Driver not found" });
    }

    const updateObject = {
      name: name ?? driverDetails.name,
      carNumber: carNumber ?? driverDetails.carNumber,
      mobile: mobile ?? driverDetails.mobile,
      srNumber: srNumber ?? driverDetails.srNumber,
      updatedAt: Date.now(),
    };

    const updatedDriver = await Driver.findOneAndUpdate(
      { driverId },
      { $set: updateObject },
      { new: true } 
    );

    if (!updatedDriver) {
      return res.status(500).json({ message: "Something went wrong! Please try again later." });
    }

    res.status(200).json({
      message: "Driver profile updated successfully",
      driver: updatedDriver,
    }); 

  }
  catch (err) {
    console.error("Error in updating the driver profile by admin:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
})

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
    {
      query.driverId ? (matchQuery.driverId = query.driverId) : null;
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

const handleToAddTheDriverCommisionEntryByAdmin = asyncHandler(async (req, res) => {
  try {
    const decoded = req.user;
    if (!decoded) {
      return res
        .status(403)
        .json({ message: "Forbidden! You are not authorized to add driver commission entry" });
    }
    const payload = req.body;
    if (!payload.driverId) {
      return res.status(400).json({ message: "driverId is required" });
    }

    const newEntry = new DriverCommisionEntry({
      entryId: entityIdGenerator("DCE"),
      driverId: payload.driverId,
      driverCommisionAmount: payload.driverCommisionAmount || 0,
      partyAmount: payload.partyAmount || 0,
      status: payload.status || "pending",
      entryDate: payload.entryDate || Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    await newEntry.save();
    res.status(201).json({ message: "Driver commission entry added successfully", entry: newEntry });
  }
  catch (err) {
    console.error("Error in adding the entry of driver commission:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

const handleToGetListOfDriverCommisionEntriesByAdmin = asyncHandler(async (req, res) => {
  try {
    const decoded = req.user;
    if (!decoded) {
      return res.status(403).json({ message: "Forbidden! You are not authorized to view driver commission entries" });
    }
    const query = req.query;
    let matchQuery = {};
    if (query.driverId) {
      matchQuery.driverId = query.driverId;
    }
    if (query.status) {
      matchQuery.status = query.status;
    }
    if (query.entryId) {
      matchQuery.entryId = query.entryId;
    }
    if (query.startDate && query.endDate) {
      matchQuery.entryDate = { $gte: new Date(query.startDate), $lte: new Date(query.endDate) };
    } else if (query.startDate) {
      matchQuery.entryDate = { $gte: new Date(query.startDate) };
    } else if (query.endDate) {
      matchQuery.entryDate = { $lte: new Date(query.endDate) };
    }

    const entries = await DriverCommisionEntry.find(matchQuery).sort({ entryDate: -1 });

    if (!entries || entries.length === 0) {
      return res.status(200).json({ message: "No driver commission entries found", entries: [] });
    }

    res.status(200).json({ message: "Driver commission entries fetched successfully", entries: entries });
  } catch (err) {
    console.error("Error in fetching driver commission entries:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
})

const handleToEditDriverCommisionEntryByAdmin = asyncHandler(async (req, res) => {
  try {
    const decoded = req.user; 
    if (!decoded) {
      return res.status(403).json({
        message: "Forbidden! You are not authorized to edit driver commission entry",
      });
    }

    const { entryId, driverCommisionAmount, partyAmount, status, entryDate, driverId } = req.body;
    if (!entryId) {
      return res.status(400).json({ message: "entryId is required" });
    }

    const commissionEntryDetails = await DriverCommisionEntry.findOne({ entryId , driverId });
    if (!commissionEntryDetails) {
      return res.status(404).json({ message: "Driver commission entry not found" });
    }

    const updateObject = {
      driverCommisionAmount: driverCommisionAmount ?? commissionEntryDetails.driverCommisionAmount,
      partyAmount: partyAmount ?? commissionEntryDetails.partyAmount,
      status: status ?? commissionEntryDetails.status,
      entryDate: entryDate ?? commissionEntryDetails.entryDate,
      updatedAt: Date.now(),
    };

    const updatedEntry = await DriverCommisionEntry.findOneAndUpdate(
      { entryId },
      { $set: updateObject },
      { new: true } 
    );

    if (!updatedEntry) {
      return res.status(500).json({ message: "Something went wrong! Please try again later." });
    }

    res.status(200).json({
      message: "Driver commission entry updated successfully",
      entry: updatedEntry,
    });

  } catch (err) {
    console.error("Error in editing the driver commission entry:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});




module.exports = {
  handleToLoginByAdmin,
  handleToAddTheDriverByAdmin,
  handleToGetAllDriversByAdmin,
  handleToAddTheDriverCommisionEntryByAdmin,
  handleToGetListOfDriverCommisionEntriesByAdmin,
  handleToEditDriverCommisionEntryByAdmin,
  handleToEditTheDriverProfileByAdmin
};
