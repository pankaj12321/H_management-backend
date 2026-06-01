const express = require("express");
const router = express.Router();
const adminRouter = require("./admin");
const staffRouter = require("./staff");
const attendanceRouter = require('./attendance')
const transectionRecordRouter = require('./transectionRecord');
const notesRouter = require('./notes')
const driverRouter = require('./driver');
const notificationRoutes =
  require('./notification');




const defaultRoutes = [
  {
    path: "/admin/staff",
    route: staffRouter,
  },
  {
    path: "/admin",
    route: adminRouter
  },
  {
    path: '/admin/attendance',
    route: attendanceRouter
  },
  {
    path: '/admin',
    route: transectionRecordRouter
  },
  {
    path: '/admin/notes',
    route: notesRouter
  },
  {
    path: '/driver',
    route: driverRouter
  },
  {
    path: '/notification',
    route: notificationRoutes
  }

];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
