const express = require("express");
const { verifyToken } = require("../middleware/verifyToken");
const router = express.Router(); 

const {handleToMarkAttendanceOfStaff,
    handleToGetAttendanceOfStaff
}= require('../controller/attendance')


router.post('/marked-for-staff',verifyToken,handleToMarkAttendanceOfStaff)

router.get('/get/staff-att',verifyToken,handleToGetAttendanceOfStaff)



const attendanceRouter = router
module.exports = attendanceRouter;


