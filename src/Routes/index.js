const express = require("express");
const overviewRouter = require("./Dashboard/overviewRouter");
const userRouter = require("./UserManagegent/userRouter");
const referralRouter = require("./Referral/referralRouter");
const fcmRouter = require("./FcmRouter/fcmRouter");
const SubscriptionPlan = require("./Subscription/subscription");
const PaymentHistory = require("./Subscription/userSubscription");
const EmployeeRouter = require("./Employee/employeeRouter")
const invoiceRouter = require("./Invoice/invoiceRouter");
const analyticRouter = require("./Analytic/analyticRouter")
const superAdminAuth = require("./Auth/superAdminRouter");
const watiRoute = require("./Wati/watiRoute");
const configRouter = require("./Config/configRoute");
const { validateJwtToken } = require("../Middlewares/validateJwtToken");


const router = express.Router();

// Apply validateJwtToken to all routes
// router.use((req, res, next) => {
//     console.log("originalUrl from validateJwtToken - ",req.originalUrl);
//     if (
//         req.originalUrl.startsWith("/api/v1/adminAuth") ||
//         req.originalUrl.startsWith("/api/v1/fcm") ||
//         req.originalUrl.startsWith("/api/v1/wati")
//     ) {
//         return next(); // Skip validation for /adminAuth,/wati and /fcm
//     }
//     validateJwtToken()(req, res, next); // Apply validation for other routes
// });

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
    {
        path: '/analytic',
        route: analyticRouter
    },
    {
        path: '/adminAuth',
        route: superAdminAuth
    },
    {
        path: '/wati',
        route: watiRoute
    },
    {
        path : '/config',
        route : configRouter
    },
];

defaultRoutes.forEach((route) => {
    router.use(route.path, route.route);
});

module.exports = router;
