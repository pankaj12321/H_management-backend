require("dotenv").config();
const Driver = require("../models/driver");
const DriverCommisionEntry = require("../models/driverCommisionEntry");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");

// ─────────────────────────────────────────────
// API 1: Driver Login (Mobile Number se)
// POST /api/driver/login
// Body: { mobile: "9XXXXXXXXX" }
// ─────────────────────────────────────────────
const handleDriverLogin = asyncHandler(async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: "Mobile number required hai. Kripya apna mobile number dalein.",
      });
    }

    // Mobile number clean karo (spaces/dashes hatao)
    const cleanMobile = String(mobile).trim().replace(/[\s\-\(\)]/g, "");

    // Database me check karo - mobile se match karo (last 10 digits bhi check karo)
    const driver = await Driver.findOne({
      $or: [
        { mobile: cleanMobile },
        { mobile: { $regex: cleanMobile.slice(-10) + "$" } },
      ],
    }).lean();

    // Agar driver nahi mila
    if (!driver) {
      return res.status(404).json({
        success: false,
        message:
          "Aap driver nahi hain. Kripya hotel owner se baat karke apna account banayein.",
      });
    }

    // Token banao - NO expiry (kabhi expire nahi hoga)
    const tokenPayload = {
      driverId: driver.driverId,
      mobile: driver.mobile,
      name: driver.name,
      carNumber: driver.carNumber,
      role: "driver",
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET);
    // Note: expiresIn nahi diya - token kabhi expire nahi hoga

    return res.status(200).json({
      success: true,
      message: "Login successful! Swagat hai.",
      token,
      driver: {
        driverId: driver.driverId,
        name: driver.name,
        mobile: driver.mobile,
        carNumber: driver.carNumber,
        location: driver.location,
        srNumber: driver.srNumber,
      },
    });
  } catch (err) {
    console.error("Error in Driver Login:", err);
    return res.status(500).json({
      success: false,
      message: "Server error. Kripya thodi der baad try karein.",
    });
  }
});

// ─────────────────────────────────────────────
// API 2: Get Driver Profile
// GET /api/driver/profile
// Header: Authorization: Bearer <token>
// ─────────────────────────────────────────────
const handleGetDriverProfile = asyncHandler(async (req, res) => {
  try {
    const decoded = req.user;

    if (!decoded || decoded.role !== "driver") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized! Sirf driver hi apna profile dekh sakta hai.",
      });
    }

    const driver = await Driver.findOne({ driverId: decoded.driverId }).lean();

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver profile nahi mila. Kripya hotel owner se sampark karein.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Driver profile successfully fetch ho gayi.",
      driver: {
        driverId: driver.driverId,
        name: driver.name,
        mobile: driver.mobile,
        carNumber: driver.carNumber,
        location: driver.location,
        email: driver.email || null,
        srNumber: driver.srNumber,
        salary: driver.salary || null,
        createdAt: driver.createdAt,
      },
    });
  } catch (err) {
    console.error("Error in Get Driver Profile:", err);
    return res.status(500).json({
      success: false,
      message: "Server error. Kripya thodi der baad try karein.",
    });
  }
});

// ─────────────────────────────────────────────
// API 3: Get Driver Commission Entries
// GET /api/driver/entries
// Header: Authorization: Bearer <token>
// Query Params (optional):
//   page, limit, startDate, endDate, status
// ─────────────────────────────────────────────
const handleGetDriverEntries = asyncHandler(async (req, res) => {
  try {
    const decoded = req.user;

    if (!decoded || decoded.role !== "driver") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized! Sirf driver hi apni entries dekh sakta hai.",
      });
    }

    const { page, limit, startDate, endDate, status } = req.query;

    // Sirf is driver ki entries laao
    let matchQuery = { driverId: decoded.driverId };

    if (status) {
      matchQuery.status = status;
    }

    if (startDate && endDate) {
      matchQuery.entryDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      matchQuery.entryDate = { $gte: new Date(startDate) };
    } else if (endDate) {
      matchQuery.entryDate = { $lte: new Date(endDate) };
    }

    let dbQuery = DriverCommisionEntry.find(matchQuery)
      .sort({ entryDate: -1 })
      .lean();

    // Pagination
    if (page && limit) {
      const skip = (parseInt(page) - 1) * parseInt(limit);
      dbQuery = dbQuery.skip(skip).limit(parseInt(limit));
    }

    const [entries, totalCount] = await Promise.all([
      dbQuery,
      DriverCommisionEntry.countDocuments(matchQuery),
    ]);

    // Total commission calculate karo
    const allEntries = await DriverCommisionEntry.find({
      driverId: decoded.driverId,
    }).lean();
    const totalCommission = allEntries.reduce(
      (sum, e) => sum + (e.driverCommisionAmount || 0),
      0
    );
    const totalPartyAmount = allEntries.reduce(
      (sum, e) => sum + (e.partyAmount || 0),
      0
    );

    const response = {
      success: true,
      message: "Driver entries successfully fetch ho gayi.",
      summary: {
        totalEntries: totalCount,
        totalCommission,
        totalPartyAmount,
      },
      entries,
    };

    if (page && limit) {
      response.pagination = {
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        currentPage: parseInt(page),
        pageSize: parseInt(limit),
      };
    }

    return res.status(200).json(response);
  } catch (err) {
    console.error("Error in Get Driver Entries:", err);
    return res.status(500).json({
      success: false,
      message: "Server error. Kripya thodi der baad try karein.",
    });
  }
});

module.exports = {
  handleDriverLogin,
  handleGetDriverProfile,
  handleGetDriverEntries,
};
