const express = require("express");
const { verifyToken } = require("../middleware/verifyToken");
const router = express.Router(); 

const { handleToAddStaffUserByAdmin,
    handleToGetStaffListByAdmin,
    handleToUpdateStaffByAdmin,
    handleToDeleteTheStaffByAdmin
 } = require("../controller/staff");

router.post("/add", verifyToken, handleToAddStaffUserByAdmin);
router.get("/get-list", verifyToken, handleToGetStaffListByAdmin);

router.patch("/update-profile", verifyToken, handleToUpdateStaffByAdmin);
router.delete("/delete-staff", verifyToken, handleToDeleteTheStaffByAdmin);















const staffRouter = router
module.exports = staffRouter;