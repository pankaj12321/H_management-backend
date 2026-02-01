require("dotenv").config();
const Admin = require("../models/admin");
const Driver = require("../models/driver");
const asyncHandler = require("express-async-handler");
const { sendEmail, sendSms } = require("../services/service");
const jwt = require("jsonwebtoken");
const { createTokenHandler } = require("../services/authToken");
const { deleteToken } = require("../middleware/verifyToken");
const { entityIdGenerator } = require("../utils/entityGenerator")
const DriverCommisionEntry = require("../models/driverCommisionEntry");
const sendWhatsAppMessage = require('../services/whatsapp');
const redisClient = require('../config/redis');


const hotelStaffCredentials = [
  {
    id: 1,
    UserName: "Blpoonamhotel",
    Password: "Blpoonamhotel1234",
    HBranchName: "Gokulpurabranch",
  },
  {
    id: 2,
    UserName: "Blpoonamhotel",
    Password: "Blpoonamhotel1234",
    HBranchName: "Sikarbranch",
  },
  {
    id: 3,
    UserName: "Blpoonamhotel",
    Password: "Blpoonamhotel1234",
    HBranchName: "Sawlibranch",
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
        admin.HBranchName.toLowerCase().trim() === HBranchName.toLowerCase().trim()
    );

    if (!validAdmin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const normalizedBranch = validAdmin.HBranchName;

    let admin = await Admin.findOne({ UserName, HBranchName: normalizedBranch });

    if (!admin) {
      admin = await Admin.create({
        adminId: entityIdGenerator("ADMIN"),
        UserName,
        Password,
        HBranchName: normalizedBranch,
        role: "admin",
      });
    }

    const token = jwt.sign(
      {
        adminId: admin.adminId,
        user: admin.UserName,
        branch: admin.HBranchName,
        password: admin.Password,
        role: "admin",
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login successful",
      user: {
        UserName: admin.UserName,
        HBranchName: admin.HBranchName,
        role: "admin",
        token,
      },
    });
  } catch (err) {
    console.error("Error in Admin Login:", err);

    if (err.code === 11000) {
      return res.status(409).json({
        message: "Admin already exists for this branch",
      });
    }

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
        salary: payload.salary,
        location: payload.location,
        addedBy: decoded.user

      });
      await newDriver.save();
      // Clear cache
      const keys = await redisClient.keys('all_drivers_*');
      if (keys.length > 0) await redisClient.del(keys);

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
  try {
    const decoded = req.user;
    if (!decoded) {
      return res
        .status(403)
        .json({ message: "Forbidden! You are not authorized to edit driver profile" });
    }
    const { driverId, name, carNumber, mobile, srNumber, location } = req.body;
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
      location: location ?? driverDetails.location,
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

    // Clear cache
    const keys = await redisClient.keys('all_drivers_*');
    if (keys.length > 0) await redisClient.del(keys);

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
      return res.status(403).json({ message: "Forbidden! You are not authorized to view drivers" });
    }

    const { name, carNumber, mobile, page = 1, limit = 10 } = req.query;
    const cacheKey = `all_drivers_${JSON.stringify(req.query)}`;

    // Check Cache
    if (redisClient.isOpen) {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
      }
    }

    let matchQuery = {};
    if (name) matchQuery.name = { $regex: name, $options: "i" };
    if (carNumber) matchQuery.carNumber = { $regex: carNumber, $options: "i" };
    if (mobile) matchQuery.mobile = mobile;

    const skip = (page - 1) * limit;

    const drivers = await Driver.find(matchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const totalDrivers = await Driver.countDocuments(matchQuery);

    const responseData = {
      message: "Drivers fetched successfully",
      drivers,
      pagination: {
        total: totalDrivers,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(totalDrivers / limit)
      }
    };

    // Set Cache (expires in 1 hour)
    if (redisClient.isOpen) {
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(responseData));
    }

    res.status(200).json(responseData);
  } catch (err) {
    console.error("Error in fetching drivers:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

const handleToAddTheDriverCommisionEntryByAdmin = asyncHandler(async (req, res) => {
  try {
    const decoded = req.user;

    if (!decoded) {
      return res.status(403).json({
        message: "Forbidden! You are not authorized to add driver commission entry"
      });
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
      branchName: decoded.branch,
      entryDate: payload.entryDate || Date.now(),
      description: payload.description || "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await newEntry.save();

    // 📲 WhatsApp message content
    const messageContent = `
Hello, your driver commission entry has been created.

Driver ID: ${payload.driverId}
Commission Amount: ${payload.driverCommisionAmount || 0}
Party Amount: ${payload.partyAmount || 0}
Status: ${payload.status || "pending"}
Entry Date: ${new Date(payload.entryDate || Date.now()).toLocaleString()}
`;

    await sendWhatsAppMessage("+918690858238", messageContent);

    res.status(201).json({
      message: "Driver commission entry added successfully",
      entry: newEntry
    });
  } catch (err) {
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (query.startDate && query.endDate) {
      matchQuery.entryDate = { $gte: new Date(query.startDate), $lte: new Date(query.endDate) };
    } else if (query.startDate) {
      matchQuery.entryDate = { $gte: new Date(query.startDate) };
    } else if (query.endDate) {
      matchQuery.entryDate = { $lte: new Date(query.endDate) };
    }

    const entries = await DriverCommisionEntry.find(matchQuery)
      .sort({ entryDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalEntries = await DriverCommisionEntry.countDocuments(matchQuery);

    if (!entries || entries.length === 0) {
      return res.status(200).json({ message: "No driver commission entries found", entries: [], pagination: { total: 0, page, limit, pages: 0 } });
    }

    res.status(200).json({
      message: "Driver commission entries fetched successfully",
      entries: entries,
      pagination: {
        total: totalEntries,
        page,
        limit,
        pages: Math.ceil(totalEntries / limit)
      }
    });
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

    const { entryId, driverCommisionAmount, partyAmount, status, entryDate, driverId, description } = req.body;
    if (!entryId) {
      return res.status(400).json({ message: "entryId is required" });
    }

    const commissionEntryDetails = await DriverCommisionEntry.findOne({ entryId });
    if (!commissionEntryDetails) {
      return res.status(404).json({ message: "Driver commission entry not found" });
    }

    const updateObject = {
      driverCommisionAmount: driverCommisionAmount ?? commissionEntryDetails.driverCommisionAmount,
      partyAmount: partyAmount ?? commissionEntryDetails.partyAmount,
      description: description ?? commissionEntryDetails.description,
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
