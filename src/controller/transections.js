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
const { personalCustomerRecordTran } = require('../models/personalCustomerUser')
const personalCustomerEntries = require('../models/personalCustomerTransectionRecord')
const getISTTime = () => {
    return new Date(Date.now() + (5.5 * 60 * 60 * 1000));  // UTC → IST
};

const getBaseUrl = (req) => {
    const protocol = (req.headers['x-forwarded-proto'] || req.protocol).split(',')[0].trim();
    const host = (req.headers['x-forwarded-host'] || req.get('host')).split(',')[0].trim();
    return `${protocol}://${host}`;
};

const { personalTransectionalUser } = require('../models/peronalTransectionalUser')
const personalTransectionUserRecord = require('../models/personalTransectionalRecord')
const khatabookTransectionUser= require('../models/khatabookCustomer')

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

        if (payload.givenToAdmin && typeof payload.givenToAdmin === "string") {
            payload.givenToAdmin = JSON.parse(payload.givenToAdmin);
        }

        if (payload.takenFromAdmin && typeof payload.takenFromAdmin === "string") {
            payload.takenFromAdmin = JSON.parse(payload.takenFromAdmin);
        }

        if (!payload.transectionUserId) {
            return res.status(400).json({
                message: "Invalid Payload: transectionUserId is required"
            });
        }

        if (!payload.givenToAdmin && !payload.takenFromAdmin) {
            return res.status(400).json({
                message: "Either givenToAdmin or takenFromAdmin is required"
            });
        }

        if (payload.givenToAdmin && !payload.givenToAdmin.hotelBranchName) {
            return res.status(400).json({
                message: "hotelBranchName is required in givenToAdmin"
            });
        }

        if (payload.takenFromAdmin && !payload.takenFromAdmin.hotelBranchName) {
            return res.status(400).json({
                message: "hotelBranchName is required in takenFromAdmin"
            });
        }
        let screenshotUrl = null;
        if (req.file) {
            screenshotUrl = `${getBaseUrl(req)}/uploads/paymentScreenshots/${req.file.filename}`;
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
                    returnDate: payload.givenToAdmin.returnDate,
                    description: payload.givenToAdmin.description,
                    paymentMode: payload.givenToAdmin.paymentMode,
                    billno: payload.givenToAdmin.billno || null,
                    hotelBranchName: payload.givenToAdmin.hotelBranchName,
                    paymentScreenshoot: screenshotUrl,
                    updatedAt: getISTTime()
                });
                existingRecord.totalGiven += payload.givenToAdmin.Rs;
            }

            if (payload.takenFromAdmin) {
                existingRecord.takenFromAdmin.push({
                    Rs: payload.takenFromAdmin.Rs,
                    returnDate: payload.takenFromAdmin.returnDate,
                    description: payload.takenFromAdmin.description,
                    billno: payload.takenFromAdmin.billno || null,
                    hotelBranchName: payload.takenFromAdmin.hotelBranchName,
                    paymentMode: payload.takenFromAdmin.paymentMode,
                    paymentScreenshoot: screenshotUrl,
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
                paymentScreenshoot: screenshotUrl,
                returnDate: payload.givenToAdmin.returnDate,
                description: payload.givenToAdmin.description,
                billno: payload.givenToAdmin.billno || null,
                hotelBranchName: payload.givenToAdmin.hotelBranchName,
                paymentMode: payload.givenToAdmin.paymentMode,
                updatedAt: getISTTime()
            });
            transectionRecord.totalGiven += payload.givenToAdmin.Rs;
        }

        if (payload.takenFromAdmin) {
            transectionRecord.takenFromAdmin.push({
                Rs: payload.takenFromAdmin.Rs,
                returnDate: payload.takenFromAdmin.returnDate,
                description: payload.takenFromAdmin.description,
                billno: payload.takenFromAdmin.billno || null,
                hotelBranchName: payload.takenFromAdmin.hotelBranchName,
                paymentScreenshoot: screenshotUrl,
                paymentMode: payload.takenFromAdmin.paymentMode,
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
        const pipeline = [];

        pipeline.push({ $match: matchQuery });

        if (query.hotelBranchName) {
            pipeline.push({
                $addFields: {
                    givenToAdmin: {
                        $filter: {
                            input: "$givenToAdmin",
                            as: "item",
                            cond: { $eq: ["$$item.hotelBranchName", query.hotelBranchName] }
                        }
                    },
                    takenFromAdmin: {
                        $filter: {
                            input: "$takenFromAdmin",
                            as: "item",
                            cond: { $eq: ["$$item.hotelBranchName", query.hotelBranchName] }
                        }
                    }
                }
            });
        }
        const transectionRecord = await TransectionUserRecord.find(matchQuery);
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

const handleToDeleteTheEntreisOfTransectionalUser = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;

        if (!decodedToken || decodedToken.role !== "admin") {
            return res.status(403).json({
                message: "Forbidden: invalid token/Unauthorized access",
            });
        }

        const { transectionUserId, type, objId } = req.body;

        if (!transectionUserId || !type || !objId) {
            return res.status(400).json({
                message: "transectionUserId, type and objId are required",
            });
        }

        if (!["givenToAdmin", "takenFromAdmin"].includes(type)) {
            return res.status(400).json({
                message: "type must be either givenToAdmin or takenFromAdmin",
            });
        }

        const record = await TransectionUserRecord.findOne({ transectionUserId });

        if (!record) {
            return res.status(404).json({
                message: "Transection record not found",
            });
        }

        const entry = record[type].find(
            (item) => item._id.toString() === objId
        );

        if (!entry) {
            return res.status(404).json({
                message: "Entry not found in selected transaction type",
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


const handleToCalculateTotalTakenAndGivenMoney = async (req, res) => {
    try {
        // const decodedToken= req.user;
        // if(!decodedToken || decodedToken.role !=='admin'){
        //     return res.status(403).json({
        //         message:"Forbidden: invalid token/Unauthorized access"
        //     });
        // }
        const transectionRecords = await TransectionUserRecord.find({});
        let totalGiven = 0;
        let totalTaken = 0;

        transectionRecords.forEach(record => {
            totalGiven += record.totalGiven;
            totalTaken += record.totalTaken;
        })
        return res.status(200).json({
            message: "Total Given and Taken money calculated successfully",
            data: {
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
            return res.status(403).json({ message: "Forbidden: invalid token/Unauthorized access" });
        }

        const payload = req.body;

        if (!payload || !payload.expenseAmount || !payload.expenseItems || !payload.hotelBranchName) {
            return res.status(400).json({
                message: "Invalid Payload: expenseAmount and expenseItems are required"
            });
        }

        let screenshotUrl = null;
        if (req.file) {
            screenshotUrl = `${getBaseUrl(req)}/uploads/paymentScreenshots/${req.file.filename}`;
        }

        const newExpense = new Expense({
            expenseId: entityIdGenerator("EX"),
            hotelBranchName: payload.hotelBranchName,
            expenseAmount: payload.expenseAmount,
            expenceItems: Array.isArray(payload.expenseItems)
                ? payload.expenseItems
                : [payload.expenseItems],
            expenseDate: payload.expenseDate || new Date(),
            paymentMode: payload.paymentMode || "cash",
            description: payload.description || "",
            paymentScreenshoot: screenshotUrl,
            billno: payload.billno || null,
            dateTime: getISTTime()
        });

        await newExpense.save();

        return res.status(201).json({
            message: "Hotel Expense added successfully",
            data: newExpense
        });

    } catch (err) {
        console.error("Error in adding hotel expense:", err);
        return res.status(500).json({ message: "Internal Server Error" });
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
        if (!payload || !payload.earningAmount || !payload.earningDetails || !payload.hotelBranchName) {
            return res.status(400).json({
                message: "Invalid Payload: earningAmount and earningDetails are required"
            });
        }

        let screenshotUrl = null;
        if (req.file) {

            screenshotUrl = `${getBaseUrl(req)}/uploads/paymentScreenshots/${req.file.filename}`;
        }

        const newEarning = new Earning({
            eariningId: entityIdGenerator("ER"),
            hotelBranchName: payload.hotelBranchName,
            earningAmount: payload.earningAmount,
            earningDetails: Array.isArray(payload.earningDetails)
                ? payload.earningDetails
                : [payload.earningDetails],
            earningDate: payload.earningDate || new Date(),
            paymentMode: payload.paymentMode || "cash",
            description: payload.description || "",
            paymentScreenshoot: screenshotUrl,
            billno: payload.billno || null,
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
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const { hotelBranchName } = req.query;

        if (!hotelBranchName) {
            return res.status(400).json({
                message: "hotelBranchName is required"
            });
        }

        const earnings = await Earning.find({ hotelBranchName });
        const expenses = await Expense.find({ hotelBranchName });

        const totalEarning = earnings.reduce(
            (sum, e) => sum + Number(e.earningAmount), 0
        );

        const totalExpense = expenses.reduce(
            (sum, e) => sum + Number(e.expenseAmount), 0
        );

        res.status(200).json({
            message: "Branch-wise report fetched successfully",
            data: {
                hotelBranchName,
                totalEarning,
                totalExpense,
                profitOrLoss: totalEarning - totalExpense,
                earnings,
                expenses
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
// handle to delete the entries of earning and expense

const handleToDeleteEarningOrExpenseEntriesByAdmin = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;
        if (!decodedToken || decodedToken.role !== "admin") {
            return res.status(403).json({
                message: "Forbidden: Only admin can perform this action",
            });
        }

        const { type, objId } = req.body;

        if (!type || !objId) {
            return res.status(400).json({
                message: "type and objId are required",
            });
        }

        if (!["earnings", "expenses"].includes(type)) {
            return res.status(400).json({
                message: "type must be either earnings or expenses",
            });
        }

        let deletedDoc;

        if (type === "earnings") {
            deletedDoc = await Earning.findByIdAndDelete(objId);
        } else {
            deletedDoc = await Expense.findByIdAndDelete(objId);
        }

        if (!deletedDoc) {
            return res.status(404).json({
                message: `${type} entry not found`,
            });
        }

        return res.status(200).json({
            message: `${type} entry deleted successfully`,
            data: deletedDoc,
        });
    } catch (error) {
        console.error("Error deleting earning/expense:", error);
        return res.status(500).json({
            message: "Internal server error",
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

        if (payload.givenToAdmin && typeof payload.givenToAdmin === "string") {
            payload.givenToAdmin = JSON.parse(payload.givenToAdmin);
        }

        if (payload.takenFromAdmin && typeof payload.takenFromAdmin === "string") {
            payload.takenFromAdmin = JSON.parse(payload.takenFromAdmin);
        }

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
        const checkHotelBranchName = (item) => !item.hotelBranchName;

        if (
            (payload.givenToAdmin && checkHotelBranchName(payload.givenToAdmin)) ||
            (payload.takenFromAdmin && checkHotelBranchName(payload.takenFromAdmin))
        ) {
            return res.status(400).json({
                message: "hotelBranchName is required for both givenToAdmin and takenFromAdmin transactions"
            });
        }

        let screenshotUrl = null;
        if (req.file) {
            screenshotUrl = `${getBaseUrl(req)}/uploads/paymentScreenshots/${req.file.filename}`;
        }

        let existingRecord = await SupplierTransactionRecord.findOne({
            supplierId: payload.supplierId
        });

        if (existingRecord) {

            if (payload.givenToAdmin) {
                existingRecord.givenToAdmin.push({
                    Rs: payload.givenToAdmin.Rs,
                    paymentScreenshoot: screenshotUrl,
                    hotelBranchName: payload.givenToAdmin.hotelBranchName,
                    returnDate: payload.givenToAdmin.returnDate,
                    description: payload.givenToAdmin.description,
                    billno: payload.givenToAdmin.billno || null,
                    paymentMode: payload.givenToAdmin.paymentMode,
                    updatedAt: getISTTime()
                });

                existingRecord.totalGiven += Number(payload.givenToAdmin.Rs);
            }

            if (payload.takenFromAdmin) {
                existingRecord.takenFromAdmin.push({
                    Rs: payload.takenFromAdmin.Rs,
                    returnDate: payload.takenFromAdmin.returnDate,
                    paymentScreenshoot: screenshotUrl,
                    description: payload.takenFromAdmin.description,
                    hotelBranchName: payload.takenFromAdmin.hotelBranchName,
                    billno: payload.takenFromAdmin.billno || null,
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
                returnDate: payload.givenToAdmin.returnDate,
                paymentScreenshoot: screenshotUrl,
                description: payload.givenToAdmin.description,
                hotelBranchName: payload.givenToAdmin.hotelBranchName,
                billno: payload.givenToAdmin.billno || null,
                paymentMode: payload.givenToAdmin.paymentMode,
                updatedAt: getISTTime()
            });

            newRecord.totalGiven += Number(payload.givenToAdmin.Rs);
        }

        if (payload.takenFromAdmin) {
            newRecord.takenFromAdmin.push({
                Rs: payload.takenFromAdmin.Rs,
                returnDate: payload.takenFromAdmin.returnDate,
                paymentScreenshoot: screenshotUrl,
                description: payload.takenFromAdmin.description,
                hotelBranchName: payload.takenFromAdmin.hotelBranchName,
                billno: payload.takenFromAdmin.billno || null,
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
        console.error("Error in Supplier transaction API:", error.message);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
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
const handleToDeleteTheEntriesOfSupplierTransection = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;

        if (!decodedToken || decodedToken.role !== "admin") {
            return res.status(403).json({
                message: "Forbidden: Only admin can access supplier transactions",
            });
        }

        const { supplierId, type, objId } = req.body;

        if (!supplierId || !type || !objId) {
            return res.status(400).json({
                message: "supplierId, type and objId are required",
            });
        }

        if (!["givenToAdmin", "takenFromAdmin"].includes(type)) {
            return res.status(400).json({
                message: "type must be either givenToAdmin or takenFromAdmin",
            });
        }

        const record = await SupplierTransactionRecord.findOne({ supplierId });

        if (!record) {
            return res.status(404).json({
                message: "Supplier transaction record not found",
            });
        }

        const entryIndex = record[type].findIndex(
            (item) => item._id.toString() === objId
        );

        if (entryIndex === -1) {
            return res.status(404).json({
                message: "Entry not found in selected transaction type",
            });
        }

        const entry = record[type][entryIndex];

        if (type === "givenToAdmin") {
            record.totalGiven = Math.max(0, record.totalGiven - entry.Rs);
        } else {
            record.totalTaken = Math.max(0, record.totalTaken - entry.Rs);
        }

        record[type].splice(entryIndex, 1);

        await record.save();

        return res.status(200).json({
            message: "Supplier transaction entry deleted successfully",
            data: record,
        });
    } catch (error) {
        console.error("Error deleting supplier transaction entry:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
});


const handleToAddPersonalTransectionalUser = async (req, res) => {
    try {
        const decodedToken = req.user;
        if (!decodedToken || decodedToken.role != "admin") {
            return res.status(403).
                json({ message: "Forbidden: invalid token/Unauthorized access" });
        }

        const payload = req.body;
        if (!payload.name || !payload.mobile) {
            return res.status(404).json({
                message: "invalid payload body"
            });
        }
        const existingPeronalUser = await personalTransectionalUser.findOne({
            name: payload.name,
            mobile: payload.mobile
        });

        if (existingPeronalUser) {
            return res.status(409).json({
                message: "this personal user already exists"
            });
        }


        const personalTransectionalUserId = entityIdGenerator('personalTR')
        const newPersonalTransectionalUser = new personalTransectionalUser({
            name: payload.name,
            email: payload.email || "",
            mobile: payload.mobile,
            status: "Active",
            personalTransectionalUserId: personalTransectionalUserId,
            createdAt: new Date(),
        })

        const data = await newPersonalTransectionalUser.save();
        return res.status(200).json({
            message: "new personal transectional user added successfully",
            data: newPersonalTransectionalUser
        })

    }
    catch (error) {
        console.error("Error in Supplier transaction API:", error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

const handleToGetPersonalUserByAdmin = asyncHandler(async (req, res) => {
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

        if (queryParams.transectionUserId) {
            matchQuery.transectionUserId = queryParams.transectionUserId;
        }

        const transectionUsers = await personalTransectionalUser.find(matchQuery).sort({ createdAt: -1 });

        return res.status(200).json({ message: "Transection Users fetched successfully", data: transectionUsers });
    } catch (err) {
        console.error("Error in fetching Transection Users:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


const handleToMakeTransectionBetweenAdminAndPersonalUser = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;

        if (!decodedToken || decodedToken.role !== "admin") {
            return res.status(403).json({
                message: "Forbidden: invalid token/Unauthorized access"
            });
        }

        const payload = req.body;

        if (!payload.personalTransectionalUserId) {
            return res.status(400).json({
                message: "Invalid Payload: personalTransectionalUserId is required"
            });
        }

        if (!payload.givenToAdmin && !payload.takenFromAdmin) {
            return res.status(400).json({
                message: "Either givenToAdmin or takenFromAdmin must be provided"
            });
        }

        if (payload.givenToAdmin && typeof payload.givenToAdmin === "string") {
            payload.givenToAdmin = JSON.parse(payload.givenToAdmin);
        }

        if (payload.takenFromAdmin && typeof payload.takenFromAdmin === "string") {
            payload.takenFromAdmin = JSON.parse(payload.takenFromAdmin);
        }

        let screenshotUrl = null;
        if (req.file) {
            screenshotUrl = `${getBaseUrl(req)}/uploads/paymentScreenshots/${req.file.filename}`;
        }

        const userExists = await personalTransectionalUser.findOne({
            personalTransectionalUserId: payload.personalTransectionalUserId
        });

        if (!userExists) {
            return res.status(404).json({
                message: "Transaction User not found"
            });
        }

        let record = await personalTransectionUserRecord.findOne({
            personalTransectionalUserId: payload.personalTransectionalUserId
        });

        if (!record) {
            record = new personalTransectionUserRecord({
                personalTransectionalUserId: payload.personalTransectionalUserId,
            });
        }

        // ✅ GIVEN TO ADMIN
        if (payload.givenToAdmin) {
            const amount = Number(payload.givenToAdmin.Rs);

            if (isNaN(amount)) {
                return res.status(400).json({ message: "Invalid amount in givenToAdmin" });
            }

            record.givenToAdmin.push({
                Rs: amount,
                paymentMode: payload.givenToAdmin.paymentMode,
                description: payload.givenToAdmin.description,
                paymentScreenshoot: screenshotUrl,
                billno: payload.givenToAdmin.billno,
                returnDate: payload.givenToAdmin.returnDate,
                updatedAt: new Date()
            });
        }

        // ✅ TAKEN FROM ADMIN
        if (payload.takenFromAdmin) {
            const amount = Number(payload.takenFromAdmin.Rs);

            if (isNaN(amount)) {
                return res.status(400).json({ message: "Invalid amount in takenFromAdmin" });
            }

            record.takenFromAdmin.push({
                Rs: amount,
                paymentMode: payload.takenFromAdmin.paymentMode,
                description: payload.takenFromAdmin.description,
                paymentScreenshoot: screenshotUrl,
                billno: payload.takenFromAdmin.billno,
                returnDate: payload.takenFromAdmin.returnDate,
                updatedAt: new Date()
            });
        }

        // ✅ RECOMPUTE TOTALS (MOST IMPORTANT)
        record.totalGiven = record.givenToAdmin.reduce(
            (sum, item) => sum + Number(item.Rs),
            0
        );

        record.totalTaken = record.takenFromAdmin.reduce(
            (sum, item) => sum + Number(item.Rs),
            0
        );

        await record.save();

        return res.status(200).json({
            message: "Transaction recorded successfully",
            data: record
        });

    } catch (err) {
        console.error("Error in recording transaction:", err);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
});

const handleToGetPersonalTransectionUserRecordByAdmin = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;

        if (!decodedToken || decodedToken.role !== "admin") {
            return res.status(403).json({
                message: "Forbidden: invalid token/Unauthorized access"
            });
        }

        const query = req.query;
        let matchQuery = {};

        if (query.personalTransectionalUserId) {
            matchQuery.personalTransectionalUserId = query.personalTransectionalUserId;
        }

        const personalTransectionRecord =
            await personalTransectionUserRecord.findOne(matchQuery);

        const countDocuments =
            await personalTransectionUserRecord.countDocuments(matchQuery);

        if (countDocuments === 0) {
            return res.status(404).json({
                message: "No personal transaction records found for the given criteria"
            });
        }

        if (!personalTransectionRecord) {
            return res.status(404).json({
                message: "Personal transaction record not found"
            });
        }

        return res.status(200).json({
            message: "Personal transaction record fetched successfully",
            data: personalTransectionRecord,
            count: countDocuments
        });

    } catch (err) {
        console.error("Error in fetching personal transaction record:", err);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
});

// handle the api's of personal transection customer user ::::::::::::::::::::::::::::::::::::::;
const handleToCreatePersonalTransectionCustomer = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;

        if (!decodedToken || decodedToken.role !== 'admin') {
            return res.status(403).json({ message: "Forbidden: invalid token/Unauthorized access" });
        }

        const payload = req.body;

        if (!payload.name || !payload.mobile || !payload.city) {
            return res.status(400).json({
                message: "Invalid Payload: 'name', 'mobile' and 'city' are required"
            });
        }

        const existingUser = await personalCustomerRecordTran.findOne({ mobile: payload.mobile });
        if (existingUser) {
            return res.status(409).json({ message: "Personal transection user with this mobile number already exists." });
        }

        const newPersonalTransectionUser = new personalCustomerRecordTran({
            name: payload.name,
            mobile: payload.mobile,
            email: payload.email,
            city: payload.city,
            state: payload.state,
            personalCustomerRecordTranId: entityIdGenerator("PT"),
            status: 'Active',
            createdAt: Date.now(),

        });

        await newPersonalTransectionUser.save();

        return res.status(201).json({ message: "Personal customer user created successfully", data: newPersonalTransectionUser });
    } catch (err) {
        console.error("Error in creating personal customer user:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

const handleToGetPersonalCustomerListByAdmin = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;

        if (!decodedToken || decodedToken.role !== 'admin') {
            return res.status(403).json({ message: "Forbidden: invalid token/Unauthorized access" });
        }

        const query = req.query;
        let matchQuery = {};

        if (query.personalCustomerRecordTranId) {
            matchQuery.personalCustomerRecordTranId = query.personalCustomerRecordTranId;
        }

        const personalTransectionRecord =
            await personalCustomerRecordTran.find(matchQuery);

        const countDocuments =
            await personalCustomerRecordTran.countDocuments(matchQuery);

        if (countDocuments === 0) {
            return res.status(404).json({
                message: "No personal customer records found for the given criteria"
            });
        }

        return res.status(200).json({
            message: "Personal customer record fetched successfully",
            data: personalTransectionRecord,
            count: countDocuments
        });

    } catch (err) {
        console.error("Error in fetching personal customer record:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
const handleToUpdateThPersonalCustomerProfile = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;

        if (!decodedToken || decodedToken.role !== 'admin') {
            return res.status(403).json({ message: "Forbidden: invalid token/Unauthorized access" });
        }

        const payload = req.body;

        if (!payload.personalCustomerRecordTranId) {
            return res.status(400).json({
                message: "Invalid Payload: 'personalCustomerRecordTranId' is required"
            });
        }

        const existingUser = await personalCustomerRecordTran.findOne({ personalCustomerRecordTranId: payload.personalCustomerRecordTranId });
        if (!existingUser) {
            return res.status(404).json({ message: "Personal customer record not found" });
        }

        existingUser.name = payload.name;
        existingUser.mobile = payload.mobile;
        existingUser.city = payload.city;
        existingUser.state = payload.state;

        await existingUser.save();

        return res.status(200).json({ message: "Personal customer profile updated successfully", data: existingUser });
    } catch (err) {
        console.error("Error in updating personal customer profile:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

const handleToCreatePersonalCustomerEntry = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;

        if (!decodedToken || decodedToken.role !== 'admin') {
            return res.status(403).json({ message: "Forbidden: invalid token/Unauthorized access" });
        }

        const payload = req.body;

        // Note: paymentScreenshoot is handled via req.file (multipart upload), not req.body
        if (!payload.personalCustomerRecordTranId || !payload.billAmount || !payload.amountPaidAfterDiscount || !payload.paymentMode || !payload.description || !payload.status) {
            return res.status(400).json({
                message: "Invalid Payload: 'personalCustomerRecordTranId', 'billAmount', 'amountPaidAfterDiscount', 'paymentMode', 'description' and 'status' are required"
            });
        }



        const existingUser = await personalCustomerRecordTran.findOne({ personalCustomerRecordTranId: payload.personalCustomerRecordTranId });
        if (!existingUser) {
            return res.status(404).json({ message: "Personal customer record not found" });
        }

        let screenshotUrl = null;
        if (req.file) {
            screenshotUrl = `${getBaseUrl(req)}/uploads/paymentScreenshots/${req.file.filename}`;
        }

        const personalCustomerEntryId = entityIdGenerator("PCE");
        const newPersonalTransectionUser = new personalCustomerEntries({
            personalCustomerRecordTranId: payload.personalCustomerRecordTranId,
            personalCustomerEntryId: personalCustomerEntryId,
            billAmount: payload.billAmount,
            amountPaidAfterDiscount: payload.amountPaidAfterDiscount,
            paymentMode: payload.paymentMode,
            hotelBranchName: decodedToken.branch,
            paymentScreenshoot: screenshotUrl,
            description: payload.description,
            status: payload.status,
            createdAt: Date.now(),
            updatedAt: Date.now()
        });

        await newPersonalTransectionUser.save();

        return res.status(201).json({ message: "Personal customer entry created successfully", data: newPersonalTransectionUser });
    } catch (err) {
        console.error("Error in creating personal customer entry:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

const handleToGetPersonalCustomerEntryByAdmin = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;

        if (!decodedToken || decodedToken.role !== 'admin') {
            return res.status(403).json({ message: "Forbidden: invalid token/Unauthorized access" });
        }

        const query = req.query;
        let matchQuery = {};

        if (query.personalCustomerRecordTranId) {
            matchQuery.personalCustomerRecordTranId = query.personalCustomerRecordTranId;
        }

        const personalCustomerEntry =
            await personalCustomerEntries.find(matchQuery);

        const countDocuments =
            await personalCustomerEntries.countDocuments(matchQuery);

        if (countDocuments === 0) {
            return res.status(404).json({
                message: "No personal customer entries found for the given criteria"
            });
        }

        return res.status(200).json({
            message: "Personal customer entry fetched successfully",
            data: personalCustomerEntry,
            count: countDocuments
        });

    } catch (err) {
        console.error("Error in fetching personal customer entry:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

const handleToUpdatePersonalCustomerEntry = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;

        if (!decodedToken || decodedToken.role !== 'admin') {
            return res.status(403).json({ message: "Forbidden: invalid token/Unauthorized access" });
        }

        const payload = req.body;

        if (!payload.personalCustomerEntryId) {
            return res.status(400).json({
                message: "Invalid Payload: 'personalCustomerEntryId' is required"
            });
        }

        const existingEntry = await personalCustomerEntries.findOne({
            personalCustomerEntryId: payload.personalCustomerEntryId
        });

        if (!existingEntry) {
            return res.status(404).json({
                message: "Personal customer entry not found"
            });
        }

        const updatePersonalCustomerEntry = await personalCustomerEntries.findOneAndUpdate({
            personalCustomerEntryId: payload.personalCustomerEntryId
        }, payload, { new: true });

        return res.status(200).json({
            message: "Personal customer entry updated successfully",
            data: updatePersonalCustomerEntry
        });
    } catch (err) {
        console.error("Error in updating personal customer entry:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

const handleToDeletePersonalCustomerEntry = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;

        if (!decodedToken || decodedToken.role !== 'admin') {
            return res.status(403).json({ message: "Forbidden: invalid token/Unauthorized access" });
        }

        const payload = req.body;
        if (!payload.personalCustomerEntryId) {
            return res.status(400).json({
                message: "Invalid Payload: 'personalCustomerEntryId' is required"
            });
        }

        const existingEntry = await personalCustomerEntries.findOne({
            personalCustomerEntryId: payload.personalCustomerEntryId
        });

        if (!existingEntry) {
            return res.status(404).json({
                message: "Personal customer entry not found"
            });
        }

        await personalCustomerEntries.deleteOne({
            personalCustomerEntryId: payload.personalCustomerEntryId
        });

        return res.status(200).json({
            message: "Personal customer entry deleted successfully",
            data: existingEntry
        });
    } catch (err) {
        console.error("Error in deleting personal customer entry:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

// khatabook api's of user:::::::::::::::::::::::::::::::::::::::::

const handleToCreateTransectionUserForKhataBook = async (req, res, next) => {
    try {
        const decodedToken = req.user;

        if (!decodedToken || decodedToken.role.toLowerCase() !== "admin") {
            return res.status(403).json({
                message: "Forbidden! You are not authorized to create Transection User.",
            });
        }

        const payload = req.body;

        if (!payload.name || !payload.mobile ||!payload.city) {
            return res.status(400).json({
                message:
                    "Invalid Payload! 'name', 'mobile' are required.",
            });
        }
        const existingUser = await khatabookTransectionUser.findOne({ mobile: payload.mobile });
        if (existingUser) {
            return res.status(409).json({ message: " khatabook Transection User with this mobile number already exists." });
        }
        if (!existingUser) {
            const newTransectionUser = new khatabookTransectionUser({
                name: payload.name,
                mobile: payload.mobile,
                city:payload.city,
                email: payload.email || '',
                khatabookUserId: entityIdGenerator("TR"),
                status: 'Active'
            });
            await newTransectionUser.save();
            return res.status(201).json({ message: " khatabook Transection User created successfully.", data: newTransectionUser });
        } else {
            return res.status(400).json({ message: " khatabook Transection User creation failed." });
        }
    } catch (err) {
        console.error("Error in creating transection user:", err);
        return res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
};

const handleToGetKhatabookUserListByAdmin = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;
        if (!decodedToken || decodedToken.role !== 'admin') {
            return res.status(403).json({ message: "Forbidden: invalid token/Unauthorized access" });
        }
        const queryParams = req.query;
        const matchQuery = {};

        if (queryParams.khatabookUserId) {
            matchQuery.khatabookUserId = queryParams.khatabookUserId;
        }

        const transectionUsers = await khatabookTransectionUser.find(matchQuery).sort({ createdAt: -1 });

        return res.status(200).json({ message: "khatabook Users fetched successfully", data: transectionUsers });
    } catch (err) {
        console.error("Error in fetching khatabook Users:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


module.exports = {
    handleToCreateTransectionUser,
    handleToGetTransectionUserListByAdmin,
    handleToMakeTransectionBetweenAdminAndUser,
    handleToDeleteTheEntreisOfTransectionalUser,
    handleToAddTheHotelExpense,
    handleToAddTheHotelEarning,
    handleToGetEarningandExpenseReport,
    handleToDeleteEarningOrExpenseEntriesByAdmin,
    handleToGetTransectionUserRecordByAdmin,
    handleToAddTheHotelSupplierPerson,
    handleToGetTheHotelSupplierPerson,
    handleToAddSupplierTransaction,
    handleToGetSupplierTransactionByOneByOne,
    handleToDeleteTheEntriesOfSupplierTransection,
    handleToCalculateTotalTakenAndGivenMoney,
    handleToCreatePersonalCustomerEntry,
    handleToAddPersonalTransectionalUser,
    handleToGetPersonalUserByAdmin,
    handleToMakeTransectionBetweenAdminAndPersonalUser,
    handleToGetPersonalTransectionUserRecordByAdmin,
    handleToCreatePersonalTransectionCustomer,
    handleToGetPersonalCustomerListByAdmin,
    handleToGetPersonalCustomerEntryByAdmin,
    handleToUpdatePersonalCustomerEntry,
    handleToDeletePersonalCustomerEntry,
    handleToUpdateThPersonalCustomerProfile,
    handleToCreateTransectionUserForKhataBook,
    handleToGetKhatabookUserListByAdmin

};
