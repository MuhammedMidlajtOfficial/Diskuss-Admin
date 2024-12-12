const express = require("express");
const overviewRouter = require("./Dashboard/overviewRouter");
const userRouter = require("./UserManagegent/userRouter");
const referralRouter = require("./Referral/referralRouter");
const fcmRouter = require("./FcmRouter/fcmRouter");
const SubscriptionPlan = require("./Subscription/subscription");
const PaymentHistory = require("./Subscription/userSubscription");
const invoiceRouter = require("./Invoice/invoiceRouter");

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
    },
    {
        path:"/payment",
        route:PaymentHistory,
    },
    {
        path: "/invoice",
        route: invoiceRouter,
    },


];

defaultRoutes.forEach((route) => {
    router.use(route.path, route.route);
});

module.exports = router;
