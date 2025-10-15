const express = require("express");
const router = express.Router();
const adminRouter = require("./admin");
const staffRouter = require("./staff");



const defaultRoutes = [

  {
    path: "/admin",
    route: adminRouter,
  },
  {
    path: "/admin/staff",
    route: staffRouter,
  }


];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
