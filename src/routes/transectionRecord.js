const express = require("express");
const { verifyToken } = require("../middleware/verifyToken");
const router = express.Router(); 

const { 
    handleToCreateTransectionUser,
    handleToGetTransectionUserListByAdmin,
    handleToMakeTransectionBetweenAdminAndUser,
    handleToAddTheHotelExpense,
    handleToAddTheHotelEarning,
    handleToGetEarningandExpenseReport,
    handleToGetTransectionUserRecordByAdmin
 } = require('../controller/transections');

router.post("/create-transection-user", verifyToken, handleToCreateTransectionUser);
router.get("/get/transection-user", verifyToken, handleToGetTransectionUserListByAdmin);
router.post("/make-transection", verifyToken, handleToMakeTransectionBetweenAdminAndUser);
router.get("/get/transection-record", verifyToken, handleToGetTransectionUserRecordByAdmin);

// routes for hotel expences and earning
router.post('/add/hotel-expense',verifyToken,handleToAddTheHotelExpense)
router.post('/add/hotel-earning',verifyToken,handleToAddTheHotelEarning)

router.get('/get/earning-expense-report',verifyToken,handleToGetEarningandExpenseReport)

const transectionRecordRouter = router
module.exports = transectionRecordRouter;