const express = require("express");
const { verifyTokenHandle } = require('../middleware/verifyToken');
const router = express.Router();






const { handleRegisterUser } = require("../controller/auth");

router.post("/register",verifyTokenHandle, handleRegisterUser);



















const userRouter = router
module.exports = userRouter;