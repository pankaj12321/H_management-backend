const express = require("express");
const { verifyToken } = require("../middleware/verifyToken");
const router = express.Router();
const upload = require("../middleware/paymentScreenshoot");

const {
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
    handleToCalculateTotalTakenAndGivenMoney,
    handleToAddThePersonalExpense,
    handleToAddThePersonalEarning,
    handleToGetPersonalEarningandExpenseReport
} = require('../controller/transections');

router.post("/create-transection-user", verifyToken, handleToCreateTransectionUser);
router.get("/get/transection-user", verifyToken, handleToGetTransectionUserListByAdmin);
router.post("/make-transection", verifyToken, upload.single("paymentScreenshoot"), handleToMakeTransectionBetweenAdminAndUser);
router.get("/get/transection-record", verifyToken, handleToGetTransectionUserRecordByAdmin);

// routes for hotel expences and earning
router.post(
    "/add/hotel-expense",
    verifyToken,
    upload.single("paymentScreenshoot"),
    handleToAddTheHotelExpense
);
router.post('/add/hotel-earning', verifyToken,
    upload.single("paymentScreenshoot"),
    handleToAddTheHotelEarning)

router.get('/get/earning-expense-report', verifyToken, handleToGetEarningandExpenseReport)

// routes for the hotel supplier and their activity routes

router.post('/add/supplier-person', verifyToken, handleToAddTheHotelSupplierPerson)
router.get('/get/supplier-persons', verifyToken, handleToGetTheHotelSupplierPerson)

// add the hotel supplier transection activity
router.post('/make-supplier-transection', verifyToken, upload.single("paymentScreenshoot"),
    handleToAddSupplierTransaction)
router.get('/get/supplier-transection', verifyToken, handleToGetSupplierTransactionByOneByOne)

router.get('/get/total-taken-amount', handleToCalculateTotalTakenAndGivenMoney)


router.post(
    "/add/personal-expense",
    verifyToken,
    upload.single("paymentScreenshoot"),
    handleToAddThePersonalExpense
);
router.post('/add/personal-earning', verifyToken,
    upload.single("paymentScreenshoot"),
    handleToAddThePersonalEarning)

router.get('/get/personal-earning-expense-report', verifyToken, handleToGetPersonalEarningandExpenseReport)


const transectionRecordRouter = router
module.exports = transectionRecordRouter;