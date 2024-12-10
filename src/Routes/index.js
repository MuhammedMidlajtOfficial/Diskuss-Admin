const express = require("express");
const overviewRouter = require("./Dashboard/overviewRouter");
const userRouter = require("./UserManagegent/userRouter");
const referralRouter = require("./Referral/referralRouter");
const fcmRouter = require("./FcmRouter/fcmRouter");
const SubscriptionPlan = require("./Subscription/subscription");

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
    {
        path:"/subscription",
        route:SubscriptionPlan,
    }

];

defaultRoutes.forEach((route) => {
    router.use(route.path, route.route);
});

module.exports = router;
