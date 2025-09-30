const express = require("express");
const { verifyTokenHandle } = require('../middleware/verifyToken');
const router = express.Router();






const { handleToLoginByAdmin } = require("../controller/admin");

router.post("/login", handleToLoginByAdmin);



















const adminRouter = router
module.exports = adminRouter;