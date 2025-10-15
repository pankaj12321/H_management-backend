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
            return res.status(409).json({ message: "Conflict: Staff user with the same Adhar Number or Mobile already exists" });
        }
        if (!existingStaffUser) {

            const staffId = entityIdGenerator("ST");
            const newStaffAdded = new Staff({
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
                createdAt: new Date(),
                updatedAt: new Date(),
                staffId: staffId
            });
            await newStaffAdded.save();
            return res.status(201).json({ message: "Staff user added successfully", newStaffAdded: newStaffAdded });
        }
    }
    catch (err) {
        console.error("Error in adding Staff:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
})

const handleToGetStaffListByAdmin = asyncHandler(async (req, res) => {
    try{
        const decodedToken = req.user;
        if (!decodedToken || decodedToken.role !== 'admin') {
            return res.status(403).json({ message: "Forbidden: invalid token/Unauthorized access" });
        }
        let matchQuery = {};
        let query = req.query;
        if (query.firstName) {
            matchQuery.firstName = { $regex: query.firstName, $options: 'i' };
        }
        if (query.lastName) {
            matchQuery.lastName = { $regex: query.lastName, $options: 'i' };
        }
        if (query.mobile) {
            matchQuery.mobile = { $regex: query.mobile, $options: 'i' };
        }
        if (query.adharNumber) {
            matchQuery.adharNumber = { $regex: query.adharNumber, $options: 'i' };
        }
        if (query.city) {
            matchQuery['address.city'] = { $regex: query.city, $options: 'i' };
        }
        if(query.staffId){
            matchQuery.staffId = { $regex: query.staffId, $options: 'i' };
        }
        const staffList = await Staff.find(matchQuery).sort({ createdAt: -1 });
        const countStaffDocuments = await Staff.countDocuments(matchQuery);
        if (!staffList || staffList.length === 0) {
            return res.status(404).json({ message: "No staff users found" });
        }
        return res.status(200).json({ message: "Staff users fetched successfully", staffList: staffList,
            countStaff: countStaffDocuments
        });

    }
    catch(err){
        console.error("Error in fetching Staff list:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
})

module.exports = {
    handleToAddStaffUserByAdmin,
    handleToGetStaffListByAdmin
}