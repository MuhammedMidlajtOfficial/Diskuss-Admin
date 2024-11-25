const express = require('express');
const overviewRouter = require("./Dashboard/overviewRouter")
const userRouter = require("./UserManagegent/userRouter")

const router = express.Router();

const defaultRoutes = [
  {
    path: "/dashboard",
    route: overviewRouter,
  },
  {
    path: "/user",
    route: userRouter,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
