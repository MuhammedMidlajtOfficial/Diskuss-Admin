// const express = require('express');
// const overviewRouter = require("./Dashboard/overviewRouter")

// const router = express.Router();

// const defaultRoutes = [
//   {
//     path: "/dashboard",
//     route: overviewRouter,
//   },
// ];

// defaultRoutes.forEach((route) => {
//   router.use(route.path, route.route);
// });

// module.exports = router;






// const express = require('express');
// const overviewRouter = require("./Dashboard/overviewRouter");

// const router = express.Router();

// const defaultRoutes = [
//   {
//     path: "/dashboard",
//     route: overviewRouter,
//   },
// ];

// defaultRoutes.forEach((route) => {
//   console.log(`Registering route: ${route.path}`);
//   router.use(route.path, route.route);
// });

// module.exports = router;




const express = require("express");
const overviewRouter = require("./Dashboard/overviewRouter"); // Import overview router

const router = express.Router();

const defaultRoutes = [
  {
    path: "/dashboard",
    route: overviewRouter,
  },
];

defaultRoutes.forEach((route) => {
  console.log(`Registering route: ${route.path}`); // Log each registered route
  router.use(route.path, route.route); // Attach the route
});

module.exports = router;
