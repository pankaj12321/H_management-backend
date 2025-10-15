const express = require("express");
const { verifyToken } = require("../middleware/verifyToken");
const router = express.Router(); 

const { handleToAddStaffUserByAdmin,
    handleToGetStaffListByAdmin
 } = require("../controller/staff");

router.post("/add", verifyToken, handleToAddStaffUserByAdmin);
router.get("/get-list", verifyToken, handleToGetStaffListByAdmin);















const staffRouter = router
module.exports = staffRouter;