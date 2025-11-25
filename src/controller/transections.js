require("dotenv").config();
const Admin = require("../models/admin");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const { createTokenHandler } = require("../services/authToken");
const { entityIdGenerator } = require("../utils/entityGenerator")
const redisClient = require("../config/redis");
const TransactionalUser = require('../models/transectional_user')
const TransectionUserRecord = require('../models/transectionRecord');
const { Earning } = require('../models/expense_earning')
const { Expense } = require('../models/expense_earning')
const Supplier = require('../models/supplier')
const SupplierTransactionRecord = require('../models/supplier-transection-record')
const getISTTime = () => {
    return new Date(Date.now() + (5.5 * 60 * 60 * 1000));  // UTC → IST
};

const handleToCreateTransectionUser = async (req, res, next) => {
    try {
        const decodedToken = req.user;

        if (!decodedToken || decodedToken.role.toLowerCase() !== "admin") {
            return res.status(403).json({
                message: "Forbidden! You are not authorized to create Transection User.",
            });
        }

        const payload = req.body;

        if (!payload.name || !payload.mobile) {
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

        if (!payload.takenFromAdmin && !payload.givenToAdmin) {
            return res.status(400).json({
                message: "Either givenToAdmin or takenFromAdmin must be provided"
            });
        }

        const transectionUserRecord = await TransactionalUser.findOne({
            transectionUserId: payload.transectionUserId
        });

        if (!transectionUserRecord) {
            return res.status(404).json({
                message: "Transection User not found"
            });
        }

        let existingRecord = await TransectionUserRecord.findOne({
            transectionUserId: payload.transectionUserId
        });

        if (existingRecord) {

            if (payload.givenToAdmin) {
                existingRecord.givenToAdmin.push({
                    Rs: payload.givenToAdmin.Rs,
                    paymentMode: payload.givenToAdmin.paymentMode, // ⭐ NEW FIELD
                    updatedAt: getISTTime()
                });
                existingRecord.totalGiven += payload.givenToAdmin.Rs;
            }

            if (payload.takenFromAdmin) {
                existingRecord.takenFromAdmin.push({
                    Rs: payload.takenFromAdmin.Rs,
                    paymentMode: payload.takenFromAdmin.paymentMode, // ⭐ NEW FIELD
                    updatedAt: getISTTime()
                });
                existingRecord.totalTaken += payload.takenFromAdmin.Rs;
            }

            await existingRecord.save();

            return res.status(200).json({
                message: "Transaction updated successfully",
                data: existingRecord
            });
        }

        // ⭐ CREATE NEW RECORD
        const transectionRecord = new TransectionUserRecord({
            transectionUserId: payload.transectionUserId
        });

        if (payload.givenToAdmin) {
            transectionRecord.givenToAdmin.push({
                Rs: payload.givenToAdmin.Rs,
                paymentMode: payload.givenToAdmin.paymentMode, // ⭐ NEW FIELD
                updatedAt: getISTTime()
            });
            transectionRecord.totalGiven += payload.givenToAdmin.Rs;
        }

        if (payload.takenFromAdmin) {
            transectionRecord.takenFromAdmin.push({
                Rs: payload.takenFromAdmin.Rs,
                paymentMode: payload.takenFromAdmin.paymentMode, // ⭐ NEW FIELD
                updatedAt: getISTTime()
            });
            transectionRecord.totalTaken += payload.takenFromAdmin.Rs;
        }

        await transectionRecord.save();

        return res.status(200).json({
            message: "Transaction recorded successfully",
            data: transectionRecord
        });

    } catch (err) {
        console.error("Error in recording transaction:", err);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
});


const handleToGetTransectionUserRecordByAdmin = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;

        if (!decodedToken || decodedToken.role !== 'admin') {
            return res.status(403).json({
                message: "Forbidden: invalid token/Unauthorized access"
            });
        }

        const query = req.query;
        let matchQuery = {};

        if (query.transectionUserId) {
            matchQuery.transectionUserId = query.transectionUserId;
        }

        const transectionRecord = await TransectionUserRecord.findOne(matchQuery);
        const countDocuments = await TransectionUserRecord.countDocuments(matchQuery);

        if (countDocuments === 0) {
            return res.status(404).json({
                message: "No transection records found for the given criteria"
            });
        }
        if (!transectionRecord) {
            return res.status(404).json({
                message: "Transection record not found for the given user ID"
            });
        }

        return res.status(200).json({
            message: "Transection record fetched successfully",
            data: transectionRecord,
            count: countDocuments   
        });

    } catch (err) {
        console.error("Error in fetching transection record:", err);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
});

const handleToCalculateTotalTakenAndGivenMoney=async(req,res)=>{
    try{
        // const decodedToken= req.user;
        // if(!decodedToken || decodedToken.role !=='admin'){
        //     return res.status(403).json({
        //         message:"Forbidden: invalid token/Unauthorized access"
        //     });
        // }
        const transectionRecords= await TransectionUserRecord.find({});
        let totalGiven=0;
        let totalTaken=0;

        transectionRecords.forEach(record=>{
            totalGiven += record.totalGiven;
            totalTaken += record.totalTaken;
        })
        return res.status(200).json({
            message:"Total Given and Taken money calculated successfully",
            data:{
                totalGiven,
                totalTaken
            }
        }); 

    }
    catch (err) {
        console.error("Error in fetching transection record:", err);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}


// Api's for the for the hotel expense and Earning ----------------

const handleToAddTheHotelExpense = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;

        if (!decodedToken || decodedToken.role !== 'admin') {
            return res.status(403).json({
                message: "Forbidden: invalid token/Unauthorized access"
            });
        }

        const payload = req.body;
        if (!payload || !payload.expenseAmount || !payload.expenseItems) {
            return res.status(400).json({
                message: "Invalid Payload: expenseAmount and expenseItems are required"
            });
        }

        const newExpense = new Expense({
            expenseId: entityIdGenerator("EX"),
            expenseAmount: payload.expenseAmount,
            expenceItems: payload.expenseItems,
            expenseDate: payload.expenseDate || new Date(),
            paymentMode: payload.paymentMode || "cash",
            dateTime: getISTTime()
        });

        await newExpense.save();

        return res.status(201).json({
            message: "Hotel Expense added successfully",
            data: newExpense
        });

    } catch (err) {
        console.error("Error in adding hotel expense:", err);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
});

const handleToAddTheHotelEarning = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;

        if (!decodedToken || decodedToken.role !== 'admin') {
            return res.status(403).json({
                message: "Forbidden: invalid token/Unauthorized access"
            });
        }

        const payload = req.body;
        if (!payload || !payload.earningAmount || !payload.earningDetails) {
            return res.status(400).json({
                message: "Invalid Payload: earningAmount and earningDetails are required"
            });
        }

        const newEarning = new Earning({
            eariningId: entityIdGenerator("ER"),
            earningAmount: payload.earningAmount,
            earningDetails: payload.earningDetails,
            earningDate: payload.earningDate || new Date(),
            paymentMode: payload.paymentMode || "cash",
            dateTime: getISTTime()
        });

        await newEarning.save();

        return res.status(201).json({
            message: "Hotel Earning added successfully",
            data: newEarning
        });

    }
    catch (err) {
        console.error("Error in adding hotel earning:", err);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
});


const handleToGetEarningandExpenseReport = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;

        if (!decodedToken || decodedToken.role !== 'admin') {
            return res.status(403).json({
                message: "Forbidden: invalid token/Unauthorized access"
            });
        }
        const earnings = await Earning.find({});
        const expenses = await Expense.find({});

        const totalMonthlyEarnings = earnings.reduce((total, earning) => total + earning.earningAmount, 0);
        const totalMonthlyExpenses = expenses.reduce((total, expense) => total + expense.expenseAmount, 0);

        return res.status(200).json({
            message: "Earning and Expense Report fetched successfully",
            data: {
                earnings,
                expenses,
                totalMonthlyEarnings,
                totalMonthlyExpenses
            }
        });

    }
    catch (err) {
        console.error("Error in adding hotel earning:", err);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
});

const handleToAddTheHotelSupplierPerson = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;

        if (!decodedToken || decodedToken.role !== 'admin') {
            return res.status(403).json({
                message: "Forbidden: invalid token/Unauthorized access"
            });
        }

        const payload = req.body;

        if (!payload.supplierName || !payload.supplierPhone || !payload.supplierCompany) {
            return res.status(400).json({
                message: "Invalid Payload: supplierName, supplierPhone & supplierCompany are required"
            });
        }

        const existingSupplier = await Supplier.findOne({
            supplierPhone: payload.supplierPhone
        });

        if (existingSupplier) {
            return res.status(400).json({
                message: "Supplier with this phone number already exists"
            });
        }

        const newSupplier = new Supplier({
            supplierId: entityIdGenerator("SUP"),
            supplierName: payload.supplierName,
            supplierEmail: payload.supplierEmail || '',
            supplierPhone: payload.supplierPhone,
            supplierCompany: payload.supplierCompany,
            createdAt: getISTTime(),
            updatedAt: getISTTime()
        });

        await newSupplier.save();

        return res.status(201).json({
            message: "Hotel Supplier Person added successfully",
            data: newSupplier
        });

    } catch (err) {
        console.error("Error in adding hotel supplier person:", err);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
});

const handleToGetTheHotelSupplierPerson = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;

        if (!decodedToken || decodedToken.role !== 'admin') {
            return res.status(403).json({
                message: "Forbidden: invalid token/Unauthorized access"
            });
        }
        const query = req.query;
        let matchQuery = {};

        if (query.supplierId) {
            matchQuery.supplierId = query.supplierId;
        }
        if (query.supplierName) {
            matchQuery.supplierName = { $regex: query.supplierName, $options: 'i' };
        }
        if (query.supplierPhone) {
            matchQuery.supplierPhone = { $regex: query.supplierPhone, $options: 'i' };
        }
        if (query.supplierCompany) {
            matchQuery.supplierCompany = { $regex: query.supplierCompany, $options: 'i' };
        }

        const suppliers = await Supplier.find(matchQuery).sort({ createdAt: -1 });
        const supplierCount = suppliers.length;

        return res.status(200).json({
            message: "Hotel Supplier Persons fetched successfully",
            data: suppliers,
            count: supplierCount

        });

    } catch (err) {
        console.error("Error in fetching hotel supplier persons:", err);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
});

const handleToAddSupplierTransaction = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;

        if (!decodedToken || decodedToken.role !== "admin") {
            return res.status(403).json({
                message: "Forbidden: Only admin can make supplier transactions"
            });
        }

        const payload = req.body;

        if (!payload.supplierId) {
            return res.status(400).json({
                message: "supplierId is required"
            });
        }

        if (!payload.givenToAdmin && !payload.takenFromAdmin) {
            return res.status(400).json({
                message: "Either givenToAdmin or takenFromAdmin must be provided"
            });
        }

        let existingRecord = await SupplierTransactionRecord.findOne({
            supplierId: payload.supplierId
        });

        if (existingRecord) {

            if (payload.givenToAdmin) {
                existingRecord.givenToAdmin.push({
                    Rs: payload.givenToAdmin.Rs,
                    paymentMode: payload.givenToAdmin.paymentMode,
                    updatedAt: getISTTime()
                });

                existingRecord.totalGiven += Number(payload.givenToAdmin.Rs);
            }

            if (payload.takenFromAdmin) {
                existingRecord.takenFromAdmin.push({
                    Rs: payload.takenFromAdmin.Rs,
                    paymentMode: payload.takenFromAdmin.paymentMode,
                    updatedAt: getISTTime()
                });

                existingRecord.totalTaken += Number(payload.takenFromAdmin.Rs);
            }

            await existingRecord.save();

            return res.status(200).json({
                message: "Supplier transaction updated successfully",
                data: existingRecord
            });
        }

        // -------------------------------------------------------------
        // -------------------------------------------------------------
        const newRecord = new SupplierTransactionRecord({
            supplierId: payload.supplierId,
        });

        if (payload.givenToAdmin) {
            newRecord.givenToAdmin.push({
                Rs: payload.givenToAdmin.Rs,
                paymentMode: payload.givenToAdmin.paymentMode,
                updatedAt: getISTTime()
            });

            newRecord.totalGiven += Number(payload.givenToAdmin.Rs);
        }

        if (payload.takenFromAdmin) {
            newRecord.takenFromAdmin.push({
                Rs: payload.takenFromAdmin.Rs,
                paymentMode: payload.takenFromAdmin.paymentMode,
                updatedAt: getISTTime()
            });

            newRecord.totalTaken += Number(payload.takenFromAdmin.Rs);
        }

        await newRecord.save();

        return res.status(200).json({
            message: "Supplier transaction recorded successfully",
            data: newRecord
        });

    } catch (error) {
        console.error("Error in Supplier transaction API:", error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
});

const handleToGetSupplierTransactionByOneByOne = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;

        if (!decodedToken || decodedToken.role !== "admin") {
            return res.status(403).json({
                message: "Forbidden: Only admin can access supplier transactions"
            });
        }

        const query = req.query;
        const matchQuery = {};

        if (query.supplierId) {
            matchQuery.supplierId = query.supplierId;
        }

        const supplierTransaction = await SupplierTransactionRecord.findOne(matchQuery);

        if (!supplierTransaction) {
            return res.status(404).json({
                message: "Supplier transaction record not found"
            });
        }

        return res.status(200).json({
            message: "Supplier transaction record fetched successfully",
            data: supplierTransaction
        });

    }
    catch (error) {
        console.error("Error in Supplier transaction API:", error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
});




module.exports = {
    handleToCreateTransectionUser,
    handleToGetTransectionUserListByAdmin,
    handleToMakeTransectionBetweenAdminAndUser,
    handleToAddTheHotelExpense,
    handleToAddTheHotelEarning,
    handleToGetEarningandExpenseReport,
    handleToGetTransectionUserRecordByAdmin,
    handleToAddTheHotelSupplierPerson,
    handleToGetTheHotelSupplierPerson,
    handleToAddSupplierTransaction,
    handleToGetSupplierTransactionByOneByOne,
    handleToCalculateTotalTakenAndGivenMoney
};
