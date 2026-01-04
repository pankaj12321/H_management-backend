const express = require("express");
const { verifyToken } = require("../middleware/verifyToken");
const router = express.Router();

const { handleToMarkAttendanceOfStaff,
    handleToGetAttendanceOfStaff,
    handleToUpdateTheAttendanceOfStaffByAdmin
} = require('../controller/attendance')


router.post('/marked-for-staff', verifyToken, handleToMarkAttendanceOfStaff)

router.get('/get/staff-att', verifyToken, handleToGetAttendanceOfStaff)
router.patch('/edit/staff-attendance', verifyToken, handleToUpdateTheAttendanceOfStaffByAdmin)



const attendanceRouter = router
module.exports = attendanceRouter;


