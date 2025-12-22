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
        const baseUrl = `${req.protocol}://${req.get("host")}`;

        let profileImageUrl = existingStaffUser.profileImage;
        let idProofImageUrl = existingStaffUser.IdProofImage;

        if (req.files?.profileImage?.length > 0) {
            profileImageUrl = `${baseUrl}/uploads/paymentScreenshots/${req.files.profileImage[0].filename}`;
        }

        if (req.files?.IdProofImage?.length > 0) {
            idProofImageUrl = `${baseUrl}/uploads/paymentScreenshots/${req.files.IdProofImage[0].filename}`;
        }

        if (existingStaffUser) {
            const updatedStaff = await Staff.findOneAndUpdate(
                { staffId: payload.staffId },
                {
                    $set: {
                        firstName: payload.firstName || existingStaffUser.firstName,
                        lastName: payload.lastName || existingStaffUser.lastName,
                        email: payload.email || existingStaffUser.email,
                        mobile: payload.mobile || existingStaffUser.mobile,
                        age: payload.age || existingStaffUser.age,
                        role: payload.role || existingStaffUser.role,
                        gender: payload.gender || existingStaffUser.gender,
                        address: {
                            city: payload.address?.city || existingStaffUser.address.city,
                            state: payload.address?.state || existingStaffUser.address.state,
                            country: payload.address?.country || existingStaffUser.address.country
                        },
                        DOB: payload.DOB || existingStaffUser.DOB,
                        IdProofImage: idProofImageUrl,
                        profileImage: profileImageUrl,
                        adharNumber: payload.adharNumber || existingStaffUser.adharNumber,
                        updatedAt: new Date()
                    }
                },
                { new: true }
            );
            return res.status(200).json({ message: "Staff user updated successfully", updatedStaff: updatedStaff });
        }
    }
    catch (err) {
        console.error("Error in fetching Staff list:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }

})

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

module.exports = {
    handleToAddStaffUserByAdmin,
    handleToGetStaffListByAdmin,
    handleToUpdateStaffByAdmin,
    handleToDeleteTheStaffByAdmin
}