const express = require('express');
const dashboardRouter = require("./Dashboard/dashboardRouter")

const router = express.Router();

const defaultRoutes = [
  {
    path: "/dashboard",
    route: dashboardRouter,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
