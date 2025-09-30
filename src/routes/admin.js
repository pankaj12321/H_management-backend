const express = require("express");
const { verifyToken}  =require("../middleware/verifyToken");
const router = express.Router();require





const {
    handleToLoginByAdmin,
    handleToAddTheDriverByAdmin,
    handleToGetAllDriversByAdmin
} = require("../controller/admin");

router.post("/login", handleToLoginByAdmin);
router.post("/add-driver", verifyToken, handleToAddTheDriverByAdmin);

router.get("/get-drivers", verifyToken, handleToGetAllDriversByAdmin);















const adminRouter = router
module.exports = adminRouter;