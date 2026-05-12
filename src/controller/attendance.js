require("dotenv").config();
const Admin = require("../models/admin");
const Driver = require("../models/driver");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const { createTokenHandler } = require("../services/authToken");
const { entityIdGenerator } = require("../utils/entityGenerator")
const { attendanceRecord } = require('../models/attendance')
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
      !["Present", "Absent", "Half Day", "Paid Leave"].includes(attendanceValue)
    ) {
      return res.status(400).json({
        message:
          "Invalid Payload! 'staffId' and valid 'attendance' (Present/Absent/Half Day/Paid Leave) are required.",
      });
    }

    const staffDetails = await Staff.findOne({ staffId: payload.staffId });
    if (!staffDetails) {
      return res.status(404).json({ message: "Staff not found!" });
    }

    const now = new Date();

    // Get IST date components
    const istDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const currentDate = istDate.getDate();
    const currentMonth = istDate.getMonth() + 1; // 0-based
    const currentYear = istDate.getFullYear();

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
          timeZone: "Asia/Kolkata",
        }),
      },
      attendanceStatus: "Marked",
    });

    await attendanceData.save();

    return res.status(201).json({
      message: "Attendance marked successfully.",
      data: attendanceData.toObject(),
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

    const [allStaff, attendanceData] = await Promise.all([
      Staff.find({}, "firstName lastName staffId mobile").lean(),
      attendanceRecord.find({
        "attendanceDetails.month": selectedMonth,
        "attendanceDetails.year": selectedYear,
      }).lean()
    ]);

    // Group attendance by staffId for O(1) lookup
    const attendanceMap = attendanceData.reduce((acc, att) => {
      if (!acc[att.staffId]) acc[att.staffId] = [];
      acc[att.staffId].push(att);
      return acc;
    }, {});

    const responseData = allStaff.map((staff) => {
      const staffAttendance = attendanceMap[staff.staffId] || [];

      const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

      // FIX → attendance object instead of string
      const dayWise = {};
      for (let i = 1; i <= daysInMonth; i++) {
        dayWise[i] = {
          attendance: "—",
          time: "—"
        };
      }

      staffAttendance.forEach((att) => {
        const day = att.attendanceDetails.date;

        dayWise[day] = {
          attendance: att.attendanceDetails.attendance || "—",
          time: att.attendanceDetails.time || "—"
        };
      });

      // Count totals
      const counts = {
        Present: 0,
        Absent: 0,
        HalfDay: 0,
        PaidLeave: 0,
      };

      Object.values(dayWise).forEach((entry) => {
        if (entry.attendance === "Present") counts.Present++;
        if (entry.attendance === "Absent") counts.Absent++;
        if (entry.attendance === "Half Day") counts.HalfDay++;
        if (entry.attendance === "Paid Leave") counts.PaidLeave++;
      });

      return {
        staffName: `${staff.firstName} ${staff.lastName}`,
        staffId: staff.staffId,
        mobile: staff.mobile,
        attendance: dayWise,  // FIXED
        totalCount: counts,
      };
    });

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1000;
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




const handleToUpdateTheAttendanceOfStaffByAdmin = async (req, res) => {
  try {
    const decodedToken = req.user;

    if (!decodedToken || decodedToken.role.toLowerCase() !== "admin") {
      return res.status(403).json({
        message: "Forbidden! You are not authorized.",
      });
    }

    const { staffId, date, month, year, attendance } = req.body;

    if (!staffId || !date || !month || !year || !attendance) {
      return res.status(400).json({
        message: "All fields are required.",
      });
    }

    if (!["Present", "Absent", "Half Day", "Paid Leave"].includes(attendance)) {
      return res.status(400).json({
        message: "Invalid attendance status.",
      });
    }

    // Block only future dates
    const todayIST = new Date(
      new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
    );

    const selectedDate = new Date(
      `${year}-${String(month).padStart(2, "0")}-${String(date).padStart(2, "0")}`
    );

    if (selectedDate > todayIST) {
      return res.status(400).json({
        message: "Cannot update attendance for future dates.",
      });
    }

    let updatedAttendance = await attendanceRecord.findOneAndUpdate(
      {
        staffId,
        "attendanceDetails.date": date,
        "attendanceDetails.month": month,
        "attendanceDetails.year": year,
      },
      {
        $set: {
          "attendanceDetails.attendance": attendance,
          "attendanceDetails.time": new Date().toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Kolkata",
          }),
          attendanceStatus: "Edited",
        },
      },
      { new: true }
    );

    // If record doesn't exist, create it (Backfill)
    if (!updatedAttendance) {
      const staffDetails = await Staff.findOne({ staffId });
      if (!staffDetails) {
        return res.status(404).json({
          message: "Staff not found! Cannot mark attendance.",
        });
      }

      updatedAttendance = new attendanceRecord({
        staffId: staffDetails.staffId,
        attendanceDetails: {
          firstName: staffDetails.firstName,
          lastName: staffDetails.lastName,
          mobile: staffDetails.mobile,
          addharNumber: staffDetails.adharNumber,
          attendance: attendance,
          date: date,
          month: month,
          year: year,
          time: new Date().toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Kolkata",
          }),
        },
        attendanceStatus: "Marked By Admin",
      });

      await updatedAttendance.save();
    }

    // Format updatedAt for UI
    const formattedUpdatedTime = new Date(updatedAttendance.updatedAt)
      .toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Kolkata",
      });

    const formattedUpdatedDate = new Date(updatedAttendance.updatedAt)
      .toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      });

    return res.status(200).json({
      message: "Attendance updated successfully.",
      updatedAt: updatedAttendance.updatedAt,
      updatedAtFormatted: `${formattedUpdatedDate}, ${formattedUpdatedTime}`,
      data: updatedAttendance,
    });

  } catch (err) {
    console.error("Attendance update error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


const autoMarkStaffPresent = async () => {
  try {
    const allStaff = await Staff.find({});
    const now = new Date();
    const istDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const currentDate = istDate.getDate();
    const currentMonth = istDate.getMonth() + 1;
    const currentYear = istDate.getFullYear();

    console.log(`[Cron Job] Starting auto-marking attendance for ${currentDate}/${currentMonth}/${currentYear}`);

    for (const staff of allStaff) {
      const existingAttendance = await attendanceRecord.findOne({
        staffId: staff.staffId,
        "attendanceDetails.date": currentDate,
        "attendanceDetails.month": currentMonth,
        "attendanceDetails.year": currentYear,
      });

      if (!existingAttendance) {
        const attendanceData = new attendanceRecord({
          staffId: staff.staffId,
          attendanceDetails: {
            firstName: staff.firstName,
            lastName: staff.lastName,
            mobile: staff.mobile,
            addharNumber: staff.adharNumber,
            attendance: "Present",
            date: currentDate,
            month: currentMonth,
            year: currentYear,
            time: "00:00:01 AM", // Set to start of day
          },
          attendanceStatus: "Marked",
        });
        await attendanceData.save();
      }
    }
    console.log(`[Cron Job] Auto-marking attendance completed.`);
  } catch (err) {
    console.error("Error in auto-marking staff attendance:", err);
  }
};


module.exports = {
  handleToMarkAttendanceOfStaff,
  handleToGetAttendanceOfStaff,
  handleToUpdateTheAttendanceOfStaffByAdmin,
  autoMarkStaffPresent
}
