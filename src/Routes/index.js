<<<<<<< Updated upstream
const express = require('express');
const overviewRouter = require("./Dashboard/overviewRouter")
=======
const express = require("express");
const overviewRouter = require("./Dashboard/overviewRouter");
const userRouter = require("./UserManagegent/userRouter");
const referralRouter = require("./Referral/referralRouter");
>>>>>>> Stashed changes

const router = express.Router();

const defaultRoutes = [
<<<<<<< Updated upstream
  {
    path: "/dashboard",
    route: overviewRouter,
  },
=======
    {
        path: "/dashboard",
        route: overviewRouter,
    },
    {
        path: "/user",
        route: userRouter,
    },
    {
        path: "/referal",
        route: referralRouter,
    },
>>>>>>> Stashed changes
];

defaultRoutes.forEach((route) => {
    router.use(route.path, route.route);
});

module.exports = router;
