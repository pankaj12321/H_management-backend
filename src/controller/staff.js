require("dotenv").config();
const Admin = require("../models/admin");
const Driver = require("../models/driver");
const asyncHandler = require("express-async-handler");
const { sendEmail, sendSms } = require("../services/service");
const jwt = require("jsonwebtoken");
const { createTokenHandler } = require("../services/authToken");
const { entityIdGenerator } = require("../utils/entityGenerator")
const redisClient = require("../config/redis");
const Staff = require("../models/staff");
const { attendanceRecord } = require("../models/attendance");
const StaffKhatabook = require("../models/staffKhatabook");
const { genSalt } = require("bcrypt");

const handleToAddStaffUserByAdmin = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;
        if (!decodedToken || decodedToken.role !== 'admin') {
            return res.status(403).json({ message: "Forbidden: invalid token/Unauthorized access" });
        }
        const payload = req.body;
        if (!payload || Object.keys(payload).length === 0) {
            return res.status(400).json({ message: "Bad Request: Missing or empty request body" });
        }
        if (!payload.firstName || !payload.lastName || !payload.adharNumber || !payload.mobile || !payload.role || !payload.address.city || !payload.DOB) {
            return res.status(400).json({ message: "Bad Request: Missing required fields" });
        }

        const existingStaffUser = await Staff.findOne({ adharNumber: payload.adharNumber, mobile: payload.mobile });

        if (existingStaffUser) {
            return res.status(409).json({
                message: "Conflict: Staff user already exists"
            });
        }


        const baseUrl = `${req.protocol}://${req.get("host")}`;

        let profileImageUrl = "";
        let idProofImageUrl = "";

        if (req.files?.profileImage?.length > 0) {
            profileImageUrl = `${baseUrl}/uploads/paymentScreenshots/${req.files.profileImage[0].filename}`;
        }

        if (req.files?.IdProofImage?.length > 0) {
            idProofImageUrl = `${baseUrl}/uploads/paymentScreenshots/${req.files.IdProofImage[0].filename}`;
        }

        const staffId = entityIdGenerator("ST");

        const newStaff = new Staff({
            firstName: payload.firstName,
            lastName: payload.lastName,
            email: payload.email || "",
            mobile: payload.mobile,
            age: payload.age || "",
            role: payload.role,
            address: {
                city: payload.address.city,
                state: payload.address.state || "",
                country: payload.address.country || ""
            },
            DOB: payload.DOB,
            adharNumber: payload.adharNumber,
            profileImage: profileImageUrl,
            branchName: payload.branchName,
            salary: payload.salary,
            salaryHistory: payload.salary ? [{ salary: payload.salary, effectiveDate: new Date() }] : [],
            IdProofImage: idProofImageUrl,
            createdAt: new Date(),
            updatedAt: new Date(),
            staffId
        });

        await newStaff.save();

        return res.status(201).json({
            message: "Staff user added successfully",
            staff: newStaff
        });

    } catch (err) {
        console.error("Error in adding Staff:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

const handleToGetStaffListByAdmin = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;
        if (!decodedToken || decodedToken.role !== 'admin') {
            return res.status(403).json({ message: "Forbidden: invalid token/Unauthorized access" });
        }
        let matchQuery = {};
        let query = req.query;

        if (query.staffId) {
            matchQuery.staffId = query.staffId
        }
        const staffList = await Staff.find(matchQuery).sort({ createdAt: -1 });
        const countStaffDocuments = await Staff.countDocuments(matchQuery);
        if (!staffList || staffList.length === 0) {
            return res.status(404).json({ message: "No staff users found" });
        }
        return res.status(200).json({
            message: "Staff users fetched successfully", staffList: staffList,
            countStaff: countStaffDocuments
        });

    }
    catch (err) {
        console.error("Error in fetching Staff list:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
})


const handleToUpdateStaffByAdmin = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;
        if (!decodedToken || decodedToken.role !== "admin") {
            return res.status(403).json({ message: "Forbidden: Unauthorized access" });
        }

        const payload = req.body;

        if (!payload.staffId) {
            return res.status(400).json({ message: "staffId is required" });
        }

        const existingStaffUser = await Staff.findOne({ staffId: payload.staffId });
        if (!existingStaffUser) {
            return res.status(404).json({ message: "Staff user not found" });
        }

        const baseUrl = `${req.protocol}://${req.get("host")}`;

        let profileImageUrl = existingStaffUser.profileImage;
        let idProofImageUrl = existingStaffUser.IdProofImage;

        if (req.files?.profileImage?.length > 0) {
            profileImageUrl = `${baseUrl}/uploads/staff/${req.files.profileImage[0].filename}`;
        }

        if (req.files?.IdProofImage?.length > 0) {
            idProofImageUrl = `${baseUrl}/uploads/staff/${req.files.IdProofImage[0].filename}`;
        }

        const isSalaryUpdated = payload.salary !== undefined && payload.salary !== existingStaffUser.salary;
        const updateQuery = {
            $set: {
                firstName: payload.firstName ?? existingStaffUser.firstName,
                lastName: payload.lastName ?? existingStaffUser.lastName,
                email: payload.email ?? existingStaffUser.email,
                mobile: payload.mobile ?? existingStaffUser.mobile,
                age: payload.age ?? existingStaffUser.age,
                role: payload.role ?? existingStaffUser.role,
                gender: payload.gender ?? existingStaffUser.gender,
                branchName: payload.branchName ?? existingStaffUser.branchName,
                salary: payload.salary ?? existingStaffUser.salary,
                DOB: payload.DOB ?? existingStaffUser.DOB,
                adharNumber: payload.adharNumber ?? existingStaffUser.adharNumber,
                profileImage: profileImageUrl,
                IdProofImage: idProofImageUrl,
                address: {
                    city: payload.address?.city ?? existingStaffUser.address?.city,
                    state: payload.address?.state ?? existingStaffUser.address?.state,
                    country: payload.address?.country ?? existingStaffUser.address?.country,
                    pincode: payload.address?.pincode ?? existingStaffUser.address?.pincode,
                    street: payload.address?.street ?? existingStaffUser.address?.street,
                },
            }
        };

        if (isSalaryUpdated) {
            const history = existingStaffUser.salaryHistory || [];

            // If this is the first update and history is empty, initialize it with the current salary
            if (history.length === 0 && existingStaffUser.salary !== undefined) {
                updateQuery.$push = {
                    salaryHistory: {
                        $each: [
                            {
                                salary: existingStaffUser.salary,
                                effectiveDate: existingStaffUser.createdAt || new Date(0)
                            },
                            {
                                salary: payload.salary,
                                effectiveDate: payload.effectiveDate ? new Date(payload.effectiveDate) : new Date()
                            }
                        ]
                    }
                };
            } else {
                updateQuery.$push = {
                    salaryHistory: {
                        salary: payload.salary,
                        effectiveDate: payload.effectiveDate ? new Date(payload.effectiveDate) : new Date()
                    }
                };
            }
        }

        const updatedStaff = await Staff.findOneAndUpdate(
            { staffId: payload.staffId },
            updateQuery,
            { new: true }
        );


        return res.status(200).json({
            message: "Staff user updated successfully",
            updatedStaff,
        });
    } catch (err) {
        console.error("Error updating staff:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


const handleToDeleteTheStaffByAdmin = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;
        if (!decodedToken || decodedToken.role !== 'admin') {
            return res.status(403).json({ message: "Forbidden: invalid token/Unauthorized access" });
        }
        const payload = req.body;
        if (!payload || Object.keys(payload).length === 0) {
            return res.status(400).json({ message: "Bad Request: Missing or empty request body" });
        }
        if (!payload.staffId) {
            return res.status(400).json({ message: "Bad Request: Missing required fields" });
        }
        const existingStaffUser = await Staff.findOne({ staffId: payload.staffId });
        if (!existingStaffUser) {
            return res.status(404).json({ message: "Staff user not found" });
        }
        if (existingStaffUser) {
            await Staff.deleteOne({ staffId: payload.staffId });
            return res.status(200).json({ message: "Staff user deleted successfully" });
        }
    }
    catch (err) {
        console.error("Error in deleting Staff user:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
})


const handleToGetStaffMonthlySalary = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;
        if (!decodedToken || decodedToken.role !== "admin") {
            return res.status(403).json({ message: "Forbidden: Unauthorized access" });
        }

        const { staffId, month, year } = req.query;
        if (!staffId || !month || !year) {
            return res.status(400).json({ message: "staffId, month, and year are required" });
        }

        const staff = await Staff.findOne({ staffId });
        if (!staff) {
            return res.status(404).json({ message: "Staff not found" });
        }

        const selectedMonth = parseInt(month);
        const selectedYear = parseInt(year);
        const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

        const attendanceRecords = await attendanceRecord.find({
            staffId: staffId,
            "attendanceDetails.month": selectedMonth,
            "attendanceDetails.year": selectedYear,
        });

        let totalEarnings = 0;
        const attendanceSummary = {
            Present: 0,
            Absent: 0,
            "Half Day": 0,
            "Paid Leave": 0,
        };

        // Use current salary if history is empty (backwards compatibility)
        const history = staff.salaryHistory && staff.salaryHistory.length > 0
            ? staff.salaryHistory
            : [{ salary: staff.salary || 0, effectiveDate: staff.createdAt || new Date(0) }];

        // Sort history by effectiveDate ascending for easier traversal if needed, 
        // but we'll use find with descent sort for each day.
        const sortedHistory = [...history].sort((a, b) => new Date(b.effectiveDate) - new Date(a.effectiveDate));

        for (let day = 1; day <= daysInMonth; day++) {
            const dateForDay = new Date(selectedYear, selectedMonth - 1, day, 23, 59, 59); // End of the day

            // Find effective salary for this day: the latest record with effectiveDate <= dateForDay
            // Since sortedHistory is DESC, the first one <= dateForDay is what we want.
            const effectiveRecord = sortedHistory.find(h => new Date(h.effectiveDate) <= dateForDay) || sortedHistory[sortedHistory.length - 1];

            let dailySalary = 0;
            if (effectiveRecord) {
                dailySalary = effectiveRecord.salary / daysInMonth;
            }

            const att = attendanceRecords.find(a => a.attendanceDetails.date === day);
            const status = att ? att.attendanceDetails.attendance : "Absent";

            attendanceSummary[status] = (attendanceSummary[status] || 0) + 1;

            if (status === "Present" || status === "Paid Leave") {
                totalEarnings += dailySalary;
            } else if (status === "Half Day") {
                totalEarnings += dailySalary * 0.5;
            }
        }

        return res.status(200).json({
            message: "Salary calculated successfully",
            staffId,
            month: selectedMonth,
            year: selectedYear,
            attendanceSummary,
            calculatedSalary: Math.round(totalEarnings),
            currentBaseSalary: staff.salary,
        });
    } catch (err) {
        console.error("Error calculating salary:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

const handleToAddStaffTransaction = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;
        if (!decodedToken || decodedToken.role !== "admin") {
            return res.status(403).json({ message: "Forbidden: Unauthorized access" });
        }

        const { staffId, Rs, paymentMode, description, type, hotelBranchName, billno, returnDate } = req.body;

        if (!staffId || !Rs || !type) {
            return res.status(400).json({ message: "staffId, Rs, and type (given/taken) are required" });
        }

        const baseUrl = `${req.protocol}://${req.get("host")}`;
        let paymentScreenshoot = "";
        if (req.files?.paymentScreenshoot?.length > 0) {
            paymentScreenshoot = `${baseUrl}/uploads/paymentScreenshots/${req.files.paymentScreenshoot[0].filename}`;
        }

        const transactionItem = {
            Rs,
            paymentMode,
            description,
            paymentScreenshoot,
            billno,
            returnDate,
            hotelBranchName,
            updatedAt: new Date()
        };

        let khatabook = await StaffKhatabook.findOne({ staffId });
        if (!khatabook) {
            khatabook = new StaffKhatabook({ staffId });
        }

        if (type === "given") {
            khatabook.givenToAdmin.push(transactionItem);
            khatabook.totalGiven += Number(Rs);
        } else if (type === "taken") {
            khatabook.takenFromAdmin.push(transactionItem);
            khatabook.totalTaken += Number(Rs);
        } else {
            return res.status(400).json({ message: "Invalid transaction type" });
        }

        await khatabook.save();

        return res.status(200).json({
            message: "Transaction added successfully",
            khatabook
        });
    } catch (err) {
        console.error("Error adding staff transaction:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

const handleToGetStaffKhatabook = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;
        if (!decodedToken || decodedToken.role !== "admin") {
            return res.status(403).json({ message: "Forbidden: Unauthorized access" });
        }

        const { staffId } = req.query;
        if (!staffId) {
            return res.status(400).json({ message: "staffId is required" });
        }
        const khatabook = await StaffKhatabook.findOne({ staffId });
        if (khatabook == 0) {
            return res.status(404).json({
                message: "Khatabook not found for this staff",
                khatabook: []
            });
        }
        else {
            return res.status(200).json({
                message: "Khatabook fetched successfully",
                khatabook
            });
        }
    } catch (err) {
        console.error("Error fetching staff khatabook:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

const handleToDeleteTheKhataBookEntriesOfStaff = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;

        if (!decodedToken || decodedToken.role !== "admin") {
            return res.status(403).json({
                message: "Forbidden: invalid token/Unauthorized access",
            });
        }

        const { staffId, type, objId } = req.body;

        if (!staffId || !type || !objId) {
            return res.status(400).json({
                message: "staffId, type and objId are required",
            });
        }

        if (!["givenToAdmin", "takenFromAdmin"].includes(type)) {
            return res.status(400).json({
                message: "type must be either givenToAdmin or takenFromAdmin",
            });
        }

        const record = await StaffKhatabook.findOne({ staffId });

        if (!record) {
            return res.status(404).json({
                message: "staff khatabook record not found",
            });
        }

        const entry = record[type].find(
            (item) => item._id.toString() === objId
        );

        if (!entry) {
            return res.status(404).json({
                message: " Entry not found in selected transaction type",
            });
        }

        if (type === "givenToAdmin") {
            record.totalGiven -= entry.Rs;
        } else {
            record.totalTaken -= entry.Rs;
        }

        record[type] = record[type].filter(
            (item) => item._id.toString() !== objId
        );

        await record.save();

        return res.status(200).json({
            message: "Transaction entry deleted successfully",
            data: record,
        });
    } catch (err) {
        console.error("Error deleting transaction entry:", err);
        return res.status(500).json({
            message: "Internal Server Error",
        });
    }
});

module.exports = {
    handleToAddStaffUserByAdmin,
    handleToGetStaffListByAdmin,
    handleToUpdateStaffByAdmin,
    handleToDeleteTheStaffByAdmin,
    handleToGetStaffMonthlySalary,
    handleToAddStaffTransaction,
    handleToGetStaffKhatabook,
    handleToDeleteTheKhataBookEntriesOfStaff
}