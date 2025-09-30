const express = require("express");
const router = express.Router();
const adminRouter = require("./admin");



const defaultRoutes = [

  {
    path: "/admin",
    route: adminRouter,
  }


];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
