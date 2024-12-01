const express = require("express");
const overviewRouter = require("./Dashboard/overviewRouter");
const userRouter = require("./UserManagegent/userRouter");
const referralRouter = require("./Referral/referralRouter");
const fcmRouter = require("./FcmRouter/fcmRouter");

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
    {
        path: "/referal",
        route: referralRouter,
    },
    {
        path: "/fcm",
        route: fcmRouter,
    },

];

defaultRoutes.forEach((route) => {
    router.use(route.path, route.route);
});

module.exports = router;
