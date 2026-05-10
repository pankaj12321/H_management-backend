const express = require("express");
const { verifyToken } = require("../middleware/verifyToken");
const router = express.Router();





const {
    handleToLoginByAdmin,
    handleToAddTheDriverByAdmin,
    handleToGetAllDriversByAdmin,
    handleToEditTheDriverProfileByAdmin,
    handleToAddTheDriverCommisionEntryByAdmin,
    handleToGetListOfDriverCommisionEntriesByAdmin,
    handleToEditDriverCommisionEntryByAdmin,
    handleToLoginByManager,
    handleToGetAllManagers,
    handleToBlockUnblockManager
} = require("../controller/admin");


router.post("/login", handleToLoginByAdmin);
router.post("/manager-login", handleToLoginByManager);
router.post("/add-driver", verifyToken, handleToAddTheDriverByAdmin);


router.get("/get-drivers", verifyToken, handleToGetAllDriversByAdmin);

router.patch("/edit-driver-profile", verifyToken, handleToEditTheDriverProfileByAdmin);

router.post("/add-driver-commision-entry", verifyToken, handleToAddTheDriverCommisionEntryByAdmin);

router.get("/get-driver-commision-entries", verifyToken, handleToGetListOfDriverCommisionEntriesByAdmin);

router.patch("/edit-driver-commision-entry", verifyToken, handleToEditDriverCommisionEntryByAdmin);

router.get("/get-managers", verifyToken, handleToGetAllManagers);
router.patch("/block-unblock-manager", verifyToken, handleToBlockUnblockManager);
















const adminRouter = router
module.exports = adminRouter;