require("dotenv").config();
const Admin = require("../models/admin");
const Driver = require("../models/driver");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const { createTokenHandler } = require("../services/authToken");
const { entityIdGenerator } = require("../utils/entityGenerator")
const redisClient = require("../config/redis");
const {attendanceRecord }= require('../models/attendance')
const Staff = require("../models/staff");


const handleToMarkAttendanceOfStaff = async (req, res, next) => {
  try {
    const decodedToken = req.user;

    if (!decodedToken || decodedToken.role.toLowerCase() !== "admin") {
      return res.status(403).json({
        message: "Forbidden! You are not authorized to mark Attendance.",
      });
    }

    const payload = req.body;
    const attendanceValue = payload?.attendanceDetails?.attendance;

    if (
      !payload.staffId ||
      !["Present", "Absent", "Half Day"].includes(attendanceValue)
    ) {
      return res.status(400).json({
        message:
          "Invalid Payload! 'staffId' and valid 'attendance' (Present/Absent/Half Day) are required.",
      });
    }

    const staffDetails = await Staff.findOne({ staffId: payload.staffId });
    if (!staffDetails) {
      return res.status(404).json({ message: "Staff not found!" });
    }

    const now = new Date();
    const currentDate = now.getDate();
    const currentMonth = now.getMonth() + 1; // 0-based
    const currentYear = now.getFullYear();

    const existingAttendance = await attendanceRecord.findOne({
      staffId: payload.staffId,
      "attendanceDetails.date": currentDate,
      "attendanceDetails.month": currentMonth,
      "attendanceDetails.year": currentYear,
    });

    if (existingAttendance) {
      return res.status(400).json({
        message: "Attendance for this staff has already been marked today.",
      });
    }

    const attendanceData = new attendanceRecord({
      staffId: staffDetails.staffId,
      attendanceDetails: {
        firstName: staffDetails.firstName,
        lastName: staffDetails.lastName,
        mobile: staffDetails.mobile,
        addharNumber: staffDetails.adharNumber,
        attendance: attendanceValue,
        date: currentDate,
        month: currentMonth,
        year: currentYear,
        time: now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      },
      attendanceStatus: "Marked",
    });

    await attendanceData.save();

    return res.status(201).json({
      message: "Attendance marked successfully.",
      data: attendanceData,
    });
  } catch (err) {
    console.error("Error in marking staff attendance:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};



const handleToGetAttendanceOfStaff = async (req, res) => {
  try {
    const decodedToken = req.user;

    if (!decodedToken || decodedToken.role.toLowerCase() !== "admin") {
      return res.status(403).json({
        message: "Forbidden! You are not authorized to view attendance data.",
      });
    }

    const { month, year } = req.query;
    const now = new Date();

    const selectedMonth = month ? parseInt(month) : now.getMonth() + 1;
    const selectedYear = year ? parseInt(year) : now.getFullYear();

    const allStaff = await Staff.find({}, "firstName lastName staffId mobile");

    const attendanceData = await attendanceRecord.find({
      "attendanceDetails.month": selectedMonth,
      "attendanceDetails.year": selectedYear,
    });

    const responseData = allStaff.map((staff) => {
      const staffAttendance = attendanceData.filter(
        (att) => att.staffId === staff.staffId
      );

      const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
      const dayWise = {};
      for (let i = 1; i <= daysInMonth; i++) {
        dayWise[i] = "—"; // default no record
      }

      staffAttendance.forEach((att) => {
        const day = att.attendanceDetails.date;
        const status = att.attendanceDetails.attendance;
        if (dayWise[day] !== undefined) {
          dayWise[day] = status;
        }
      });

      const counts = {
        Present: 0,
        Absent: 0,
        HalfDay: 0,
      };

      Object.values(dayWise).forEach((val) => {
        if (val === "Present") counts.Present++;
        else if (val === "Absent") counts.Absent++;
        else if (val === "Half Day" || val === "HalfDay") counts.HalfDay++;
      });

      return {
        staffName: `${staff.firstName} ${staff.lastName}`,
        staffId: staff.staffId,
        mobile: staff.mobile,
        attendance: dayWise,
        totalCount: counts,
      };
    });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedData = responseData.slice(startIndex, endIndex);

    return res.status(200).json({
      message: "Monthly Attendance Data fetched successfully.",
      month: selectedMonth,
      year: selectedYear,
      totalStaff: responseData.length,
      currentPage: page,
      totalPages: Math.ceil(responseData.length / limit),
      data: paginatedData,
    });
  } catch (err) {
    console.error("Error fetching attendance data:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports={
    handleToMarkAttendanceOfStaff,
    handleToGetAttendanceOfStaff
}



