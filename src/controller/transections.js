require("dotenv").config();
const Admin = require("../models/admin");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const { createTokenHandler } = require("../services/authToken");
const { entityIdGenerator } = require("../utils/entityGenerator")
const redisClient = require("../config/redis");
const TransactionalUser = require('../models/transectional_user')
const TransectionUserRecord = require('../models/transectionRecord');
const Earning= require('../models/expense_earning')
const Expense= require('../models/expense_earning')

const handleToCreateTransectionUser = async (req, res, next) => {
    try {
        const decodedToken = req.user;

        if (!decodedToken || decodedToken.role.toLowerCase() !== "admin") {
            return res.status(403).json({
                message: "Forbidden! You are not authorized to create Transection User.",
            });
        }

        const payload = req.body;

        if (!payload.name  || !payload.mobile) {
            return res.status(400).json({
                message:
                    "Invalid Payload! 'name', 'mobile' are required.",
            });
        }
        const existingUser = await TransactionalUser.findOne({ mobile: payload.mobile });
        if (existingUser) {
            return res.status(409).json({ message: "Transection User with this mobile number already exists." });
        }
        if (!existingUser) {
            const newTransectionUser = new TransactionalUser({
                name: payload.name,
                mobile: payload.mobile,
                email: payload.email || '',             
                transectionUserId: entityIdGenerator("TR"),
                status: 'Active'
            });
            await newTransectionUser.save();
            return res.status(201).json({ message: "Transection User created successfully.", data: newTransectionUser });
        } else {
            return res.status(400).json({ message: "Transection User creation failed." });
        }
    } catch (err) {
        console.error("Error in creating transection user:", err);
        return res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
};

const handleToGetTransectionUserListByAdmin = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;
        if (!decodedToken || decodedToken.role !== 'admin') {
            return res.status(403).json({ message: "Forbidden: invalid token/Unauthorized access" });
        }
        const queryParams = req.query;
        const matchQuery = {};
        if (queryParams.status) {
            matchQuery.status = queryParams.status;
        }
        if (queryParams.name) {
            matchQuery.name = { $regex: queryParams.name, $options: 'i' };
        }
        if (queryParams.mobile) {
            matchQuery.mobile = { $regex: queryParams.mobile, $options: 'i' };
        }
        if (queryParams.email) {
            matchQuery.email = { $regex: queryParams.email, $options: 'i' };
        }
        if (queryParams.transectionUserId) {
            matchQuery.transectionUserId = queryParams.transectionUserId;
        }

        const transectionUsers = await TransactionalUser.find(matchQuery).sort({ createdAt: -1 });

        return res.status(200).json({ message: "Transection Users fetched successfully", data: transectionUsers });
    } catch (err) {
        console.error("Error in fetching Transection Users:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

/* handle to make the transection between admin and transection user here is the apis for this
functionality will be added later */

const handleToMakeTransectionBetweenAdminAndUser = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;

        if (!decodedToken || decodedToken.role !== 'admin') {
            return res.status(403).json({
                message: "Forbidden: invalid token/Unauthorized access"
            });
        }

        const payload = req.body;

        if (!payload.transectionUserId) {
            return res.status(400).json({
                message: "Invalid Payload: transectionUserId is required"
            });
        }

        if (!payload.givenToAdmin && !payload.takenFromAdmin) {
            return res.status(400).json({
                message: "Either givenToAdmin or takenFromAdmin must be provided"
            });
        }

        let transectionUserRecord = await TransactionalUser.findOne({
            transectionUserId: payload.transectionUserId
        });

        if(!transectionUserRecord) {
            return res.status(404).json({
                message: "Transection User not found"
            });
        }
        if(transectionUserRecord){
            let existingRecord = await TransectionUserRecord.findOne({
                transectionUserId: payload.transectionUserId
            });

            if (existingRecord) {
                if (payload.givenToAdmin) {
                    existingRecord.givenToAdmin.push({
                        Rs: payload.givenToAdmin.Rs
                    });
                    existingRecord.totalGiven += payload.givenToAdmin.Rs;
                }
                if (payload.takenFromAdmin) {
                    existingRecord.takenFromAdmin.push({
                        Rs: payload.takenFromAdmin.Rs
                    });
                    existingRecord.totalTaken += payload.takenFromAdmin.Rs;
                }
                await existingRecord.save();
                return res.status(200).json({
                    message: "Transaction updated successfully",
                    data: existingRecord
                });
            }   else {
            let transectionRecord = new TransectionUserRecord({
                transectionUserId: payload.transectionUserId,
            })
            if (payload.givenToAdmin) {
                transectionRecord.givenToAdmin.push({
                    Rs: payload.givenToAdmin.Rs
                });
                transectionRecord.totalGiven += payload.givenToAdmin.Rs;
            }
            if (payload.takenFromAdmin) {
                transectionRecord.takenFromAdmin.push({
                    Rs: payload.takenFromAdmin.Rs
                });
                transectionRecord.totalTaken += payload.takenFromAdmin.Rs;
            }
            await transectionRecord.save();
            return res.status(200).json({
                message: "Transaction recorded successfully",
                data: transectionRecord
            });
        }

        }

    } catch (err) {
        console.error("Error in recording transaction:", err);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
});


// Api's for the for the hotel expense and Earning ----------------

const handleToAddTheHotelExpense= asyncHandler(async(req,res)=>{
    try{
        const decodedToken = req.user;
         if (!decodedToken || decodedToken.role !== 'admin') {
            return res.status(403).json({
                message: "Forbidden: invalid token/Unauthorized access"
            });
        }

        const payload= req.body;
        if(!payload || !payload.expenceAmount || !payload.expenceItems){
            return res.status(400).json({
                message: "Invalid Payload: expenceAmount and expenceItems are required"
            });
        }
        const newExpense= new Expense({
            expenseId: entityIdGenerator("EX"),
            expenseAmount: payload.expenseAmount,
            expenceItems: payload.expenceItems,
            expenseDate: payload.expenseDate || new Date(),
            paymentMode: payload.paymentMode || "cash"
        });
        await newExpense.save();
        return res.status(201).json({
            message: "Hotel Expense added successfully",
            data: newExpense
        });

    }
    catch (err) {
        console.error("Error in adding hotel expense:", err);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
})


module.exports = {
    handleToCreateTransectionUser,
    handleToGetTransectionUserListByAdmin,
    handleToMakeTransectionBetweenAdminAndUser,
    handleToAddTheHotelExpense
};
