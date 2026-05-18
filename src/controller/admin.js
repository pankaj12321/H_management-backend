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
const { sendWhatsAppMessage, sendWhatsAppTemplate } = require('../services/whatsapp');
const { formatIndianPhone } = require("../utils/formatIndianphone");
const Manager = require("../models/manager");



const hotelStaffCredentials = [
  {
    id: 1,
    UserName: "Blpoonamhotel",
    Password: "Blpoonamhotel7740",
    HBranchName: "Blpoonam",
  },
  {
    id: 2,
    UserName: "Blpoonamhotel",
    Password: "Blpoonamhotel7740",
    HBranchName: "Newpoonam",
  },
  {
    id: 3,
    UserName: "Blpoonamhotel",
    Password: "Blpoonamhotel7740",
    HBranchName: "Poonam",
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
      { expiresIn: "30d" }
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

const handleToLoginByManager = asyncHandler(async (req, res) => {
  try {
    const { UserName, Password, HBranchName, managerName, mobileNumber } = req.body;

    if (!UserName || !Password || !HBranchName || !managerName || !mobileNumber) {
      return res.status(400).json({ message: "All fields are required (UserName, Password, HBranchName, managerName, mobileNumber)" });
    }

    const validAdmin = hotelStaffCredentials.find(
      (admin) =>
        admin.UserName === UserName &&
        Password === "Blpoonamhotel1234" &&
        admin.HBranchName.toLowerCase().trim() === HBranchName.toLowerCase().trim()
    );

    if (!validAdmin) {
      return res.status(401).json({ message: "Invalid branch credentials" });
    }

    const normalizedBranch = validAdmin.HBranchName;
    const normalizedMobile = formatIndianPhone(mobileNumber);

    // Check if this mobile number is blocked globally (across any branch)
    const globallyBlocked = await Manager.findOne({ mobileNumber: normalizedMobile, isBlocked: true });

    if (globallyBlocked) {
      return res.status(403).json({
        message: "Aapka mobile number block kar diya gaya hai. Kripya owner se sampark karein."
      });
    }

    let manager = await Manager.findOne({ mobileNumber: normalizedMobile });

    if (!manager) {
      manager = await Manager.create({
        managerId: entityIdGenerator("MGR"),
        managerName: managerName.trim(),
        mobileNumber: normalizedMobile,
        UserName,
        Password,
        HBranchName: normalizedBranch,
        role: "manager",
        isBlocked: false
      });
    } else {
      // If manager exists, update their details for the current login session
      manager.managerName = managerName.trim();
      manager.HBranchName = normalizedBranch;
      manager.UserName = UserName;
      manager.Password = Password;
      await manager.save();
    }

    if (manager.isBlocked) {
      return res.status(403).json({ message: "Aapka account block kar diya gaya hai. Kripya owner se sampark karein." });
    }

    const token = jwt.sign(
      {
        managerId: manager.managerId,
        user: manager.UserName,
        branch: manager.HBranchName,
        name: manager.managerName,
        mobile: manager.mobileNumber,
        role: "manager",
      },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.status(200).json({
      message: "Login successful",
      user: {
        managerName: manager.managerName,
        mobileNumber: manager.mobileNumber,
        HBranchName: manager.HBranchName,
        role: "manager",
        token,
      },
    });
  } catch (err) {
    console.error("Error in Manager Login:", err);

    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || "field";
      return res.status(409).json({
        message: `Is ${field} se pahle hi manager exists hai. Kripya check karein.`,
        error: err.message
      });
    }

    res.status(500).json({ message: "Internal Server Error" });
  }
});

const handleToGetAllManagers = asyncHandler(async (req, res) => {
  try {
    const decoded = req.user;
    if (!decoded || decoded.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized! Only owner can see managers list" });
    }

    const managers = await Manager.find({ HBranchName: decoded.branch }).sort({ createdAt: -1 });

    res.status(200).json({
      message: "Managers fetched successfully",
      managers
    });
  } catch (err) {
    console.error("Error in fetching managers:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

const handleToBlockUnblockManager = asyncHandler(async (req, res) => {
  try {
    const decoded = req.user;
    if (!decoded || decoded.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized! Only owner can block/unblock managers" });
    }

    const { managerId, isBlocked } = req.body;

    if (!managerId || isBlocked === undefined) {
      return res.status(400).json({ message: "managerId and isBlocked status are required" });
    }

    const updatedManager = await Manager.findOneAndUpdate(
      { managerId },
      { $set: { isBlocked } },
      { new: true }
    );

    if (!updatedManager) {
      return res.status(404).json({ message: "Manager not found" });
    }

    res.status(200).json({
      message: `Manager ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
      manager: updatedManager
    });
  } catch (err) {
    console.error("Error in blocking/unblocking manager:", err);
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

    const phone = formatIndianPhone(newDriver.mobile);
    const templateName = "driver_add_profile"; // Updated to driver_add_profile

    // Template variables for 'driver_add_profile' template: (none required)
    const bodyParams = [];

    const response = await sendWhatsAppTemplate(phone, templateName, "en", bodyParams);
    console.log(response);

    res.status(201).json({ message: "Driver added successfully", driver: newDriver, response });

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
    const { name, carNumber, mobile, page, limit } = req.query;

    let matchQuery = {};
    if (name) {
      matchQuery.name = { $regex: name, $options: "i" };
    }
    if (carNumber) {
      matchQuery.carNumber = { $regex: carNumber, $options: "i" };
    }
    if (mobile) {
      matchQuery.mobile = { $regex: mobile, $options: "i" };
    }

    let dbQuery = Driver.find(matchQuery).sort({ createdAt: -1 }).lean();

    if (page && limit) {
      const skip = (parseInt(page) - 1) * parseInt(limit);
      dbQuery = dbQuery.skip(skip).limit(parseInt(limit));
    }

    const [drivers, totalCount] = await Promise.all([
      dbQuery,
      Driver.countDocuments(matchQuery)
    ]);

    const response = {
      message: "Drivers fetched successfully",
      drivers: drivers,
    };

    if (page && limit) {
      response.pagination = {
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        currentPage: parseInt(page),
        pageSize: parseInt(limit)
      };
    }

    res.status(200).json(response);
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

    const driverDetails = await Driver.findOne({ driverId: payload.driverId });
    if (!driverDetails) {
      return res.status(404).json({ message: "Driver not found" });
    }

    const newEntry = new DriverCommisionEntry({
      entryId: entityIdGenerator("DCE"),
      driverId: payload.driverId,
      driverName: driverDetails.name,
      carNumber: driverDetails.carNumber,
      mobile: driverDetails.mobile,
      srNumber: driverDetails.srNumber,
      driverCommisionAmount: payload.driverCommisionAmount || 0,
      partyAmount: payload.partyAmount || 0,
      status: payload.status || "pending",
      foodTaken: payload.foodTaken,
      branchName: decoded.branch,
      entryDate: payload.entryDate || Date.now(),
      description: payload.description || "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await newEntry.save();

    // Send WhatsApp notification
    try {
      if (newEntry.mobile) {
        const phone = formatIndianPhone(newEntry.mobile);
        const templateName = "namste";
        const bodyParams = []; // Template has no variables based on user input

        await sendWhatsAppTemplate(phone, templateName, "en", bodyParams);
      }
    } catch (wsError) {
      console.error("Error sending WhatsApp for commission entry:", wsError);
    }

    res.status(201).json({ message: "Driver commission entry added successfully", entry: newEntry });

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
    const { driverId, status, entryId, startDate, endDate, page, limit } = req.query;

    let matchQuery = {};
    if (driverId) {
      matchQuery.driverId = driverId;
    }
    if (status) {
      matchQuery.status = status;
    }
    if (entryId) {
      matchQuery.entryId = entryId;
    }
    if (startDate && endDate) {
      matchQuery.entryDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else if (startDate) {
      matchQuery.entryDate = { $gte: new Date(startDate) };
    } else if (endDate) {
      matchQuery.entryDate = { $lte: new Date(endDate) };
    }

    let dbQuery = DriverCommisionEntry.find(matchQuery).sort({ entryDate: -1 }).lean();

    if (page && limit) {
      const skip = (parseInt(page) - 1) * parseInt(limit);
      dbQuery = dbQuery.skip(skip).limit(parseInt(limit));
    }

    const [entries, totalCount] = await Promise.all([
      dbQuery,
      DriverCommisionEntry.countDocuments(matchQuery)
    ]);

    const response = {
      message: "Driver commission entries fetched successfully",
      entries: entries,
    };

    if (page && limit) {
      response.pagination = {
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        currentPage: parseInt(page),
        pageSize: parseInt(limit)
      };
    }

    res.status(200).json(response);
  } catch (err) {
    console.error("Error in fetching driver commission entries:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

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

    // Send WhatsApp Message using Template
    let response
    try {
      if (updatedEntry.mobile) {
        const phone = formatIndianPhone(updatedEntry.mobile);
        const templateName = process.env.WHINTA_COMMISSION_TEMPLATE || "bl_poonam_hotel";

        // Template variables for the new structure:
        // {{1}} -> Branch Name
        // {{2}} -> Driver Commission Amount
        // {{3}} -> Status
        const bodyParams = [
          updatedEntry.branchName || "Blpoonam",
          updatedEntry.driverCommisionAmount || 0,
          updatedEntry.status || "pending"
        ];

        response = await sendWhatsAppTemplate(phone, templateName, "en", bodyParams);
        console.log("WhatsApp Template Response:", response);
      }
    } catch (wsError) {
      console.error("Error sending WhatsApp template for commission entry:", wsError);
    }

    res.status(200).json({
      message: "Driver commission entry updated successfully",
      entry: updatedEntry,
      response
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
  handleToEditTheDriverProfileByAdmin,
  handleToLoginByManager,
  handleToGetAllManagers,
  handleToBlockUnblockManager
};
