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
    handleToCalculateTotalTakenAndGivenMoney
 } = require('../controller/transections');

router.post("/create-transection-user", verifyToken, handleToCreateTransectionUser);
router.get("/get/transection-user", verifyToken, handleToGetTransectionUserListByAdmin);
router.post("/make-transection", verifyToken, handleToMakeTransectionBetweenAdminAndUser);
router.get("/get/transection-record", verifyToken, handleToGetTransectionUserRecordByAdmin);

// routes for hotel expences and earning
router.post(
    "/add/hotel-expense",
    upload.single("paymentScreenshot"),  verifyToken,
    handleToAddTheHotelExpense
);router.post('/add/hotel-earning',verifyToken,handleToAddTheHotelEarning)

router.get('/get/earning-expense-report',verifyToken,handleToGetEarningandExpenseReport)

// routes for the hotel supplier and their activity routes

router.post('/add/supplier-person',verifyToken,handleToAddTheHotelSupplierPerson)
router.get('/get/supplier-persons',verifyToken,handleToGetTheHotelSupplierPerson)

// add the hotel supplier transection activity
router.post('/make-supplier-transection',verifyToken,handleToAddSupplierTransaction)
router.get('/get/supplier-transection',verifyToken,handleToGetSupplierTransactionByOneByOne)

router.get('/get/total-taken-amount',handleToCalculateTotalTakenAndGivenMoney)



const transectionRecordRouter = router
module.exports = transectionRecordRouter;