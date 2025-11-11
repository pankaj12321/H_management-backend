const express = require("express");
const { verifyToken } = require("../middleware/verifyToken");
const router = express.Router(); 

const { 
    handleToCreateTransectionUser,
    handleToGetTransectionUserListByAdmin,
    handleToMakeTransectionBetweenAdminAndUser,
    handleToAddTheHotelExpense,
 } = require('../controller/transections');

router.post("/create-transection-user", verifyToken, handleToCreateTransectionUser);
router.get("/get/transection-user", verifyToken, handleToGetTransectionUserListByAdmin);
router.post("/make-transection", verifyToken, handleToMakeTransectionBetweenAdminAndUser);

// routes for hotel expences and earning
router.post('/add/hotel-expense',verifyToken,handleToAddTheHotelExpense)

const transectionRecordRouter = router
module.exports = transectionRecordRouter;