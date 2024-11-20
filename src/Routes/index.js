const express = require('express');
const overviewRouter = require("./Dashboard/overviewRouter")

const router = express.Router();

const defaultRoutes = [
  {
    path: "/dashboard",
    route: overviewRouter,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
