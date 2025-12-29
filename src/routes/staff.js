const express = require("express");
const { verifyToken } = require("../middleware/verifyToken");
const upload = require("../middleware/paymentScreenshoot");

const router = express.Router();

const { handleToAddStaffUserByAdmin,
    handleToGetStaffListByAdmin,
    handleToUpdateStaffByAdmin,
    handleToDeleteTheStaffByAdmin
} = require("../controller/staff");

router.post(
    "/add",
    verifyToken,
    upload.fields([
        { name: "profileImage", maxCount: 1 },
        { name: "IdProofImage", maxCount: 1 }
    ]),
    handleToAddStaffUserByAdmin
);

router.get("/get-list", verifyToken, handleToGetStaffListByAdmin);

router.patch(
    "/update-profile",
    verifyToken,
    upload.fields([
        { name: "profileImage", maxCount: 1 },
        { name: "IdProofImage", maxCount: 1 }
    ]),
    handleToUpdateStaffByAdmin
); router.delete("/delete-staff", verifyToken, handleToDeleteTheStaffByAdmin);















const staffRouter = router
module.exports = staffRouter;