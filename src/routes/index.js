const express = require("express");
const router = express.Router();
const userRouter = require("./auth");



const defaultRoutes = [
//   {
//     path: "/api/admin",
//     route: adminRouter,
//   },
  {
    path: "/api/user",
    route: userRouter,
  }
//   {
//     path:"/api/quran",
//     route:quranRouter
//   },
//   {
//     path:"/api/teacher",
//     route:teacherRouter
//   },
//   {
//     path:"/api/student",
//     route:studentRouter
//   },
//   {
//     path:"/api/review",
//     route:reviewRouter
//   }

];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
