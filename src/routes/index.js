const express = require("express");
const router = express.Router();
const adminRouter = require("./admin");
const staffRouter = require("./staff");
const attendanceRouter= require('./attendence')
const transectionRecordRouter = require('./transectionRecord');



const defaultRoutes = [

  {
    path: "/admin",
    route: adminRouter,
  },
  {
    path: "/admin/staff",
    route: staffRouter,
  },
  {
    path:'/admin/attendance',
    route:attendanceRouter
  },
  {
    path:'/admin',
    route:transectionRecordRouter
  }

];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
