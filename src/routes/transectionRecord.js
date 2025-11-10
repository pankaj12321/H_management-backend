const express = require("express");
const { verifyToken } = require("../middleware/verifyToken");
const router = express.Router(); 

const { 
    handleToCreateTransectionUser,
    handleToGetTransectionUserListByAdmin,
    handleToMakeTransectionBetweenAdminAndUser
 } = require('../controller/transections');

router.post("/create-transection-user", verifyToken, handleToCreateTransectionUser);
router.get("/get/transection-user", verifyToken, handleToGetTransectionUserListByAdmin);
router.post("/make-transection", verifyToken, handleToMakeTransectionBetweenAdminAndUser);

const transectionRecordRouter = router
module.exports = transectionRecordRouter;