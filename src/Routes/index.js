const express = require("express");
const overviewRouter = require("./Dashboard/overviewRouter");
const userRouter = require("./UserManagegent/userRouter");
const referralRouter = require("./Referral/referralRouter");
const fcmRouter = require("./FcmRouter/fcmRouter");
const SubscriptionPlan = require("./Subscription/subscription");
<<<<<<< HEAD
=======
const PaymentHistory = require("./Subscription/userSubscription");
const EmployeeRouter = require("./Employee/employeeRouter")
const invoiceRouter = require("./Invoice/invoiceRouter");
>>>>>>> 49f557cb0fa4535aa5c6836b736378d6fd1786db

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
        path: "/employee",
        route:EmployeeRouter
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
