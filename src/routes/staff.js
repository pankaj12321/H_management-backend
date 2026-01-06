const express = require("express");
const { verifyToken } = require("../middleware/verifyToken");
const upload = require("../middleware/paymentScreenshoot");

const router = express.Router();

const {
    handleToAddStaffUserByAdmin,
    handleToGetStaffListByAdmin,
    handleToUpdateStaffByAdmin,
    handleToDeleteTheStaffByAdmin,
    handleToGetStaffMonthlySalary,
    handleToAddStaffTransaction,
    handleToGetStaffKhatabook,
    handleToDeleteTheKhataBookEntriesOfStaff
} = require("../controller/staff");

router.post(
    "/add",
    verifyToken,
    upload.fields([
        { name: "profileImage", maxCount: 1 },
        { name: "IdProofImage", maxCount: 2 }
    ]),
    handleToAddStaffUserByAdmin
);

router.get("/get-list", verifyToken, handleToGetStaffListByAdmin);

router.patch(
    "/update-profile",
    verifyToken,
    upload.fields([
        { name: "profileImage", maxCount: 1 },
        { name: "IdProofImage", maxCount: 2 }
    ]),
    handleToUpdateStaffByAdmin
);

router.delete("/delete-staff", verifyToken, handleToDeleteTheStaffByAdmin);

router.get("/calculate-salary", verifyToken, handleToGetStaffMonthlySalary);

router.post("/khatabook/add-transaction",
    verifyToken,
    upload.fields([{ name: "paymentScreenshoot", maxCount: 1 }]),
    handleToAddStaffTransaction
);

router.get("/khatabook/get-details", verifyToken, handleToGetStaffKhatabook);

router.delete("/khatabook/delete-entry", verifyToken, handleToDeleteTheKhataBookEntriesOfStaff);
















const staffRouter = router
module.exports = staffRouter;