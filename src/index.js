// const express = require("express");
// const cors = require("cors");
// const router = require("./Routes/index");
// const connectDB = require("./DBConfig");

// const app = express();
// app.use(cors());
// app.use(express.json({ limit: "50mb" }));
// app.use("/api/v1", router)

// app.use((err, req, res, next) => {
//   res.locals.error = err;
//   console.log(err);
//   const statusCode = err.status || 500; // Default to 500 if no status is set
//   res.status(statusCode).send({
//       message: err.message || 'Internal Server Error',
//   });
// });

// const PORT = process.env.PORT || 3000
// connectDB.then(() => {
//   app.listen(PORT, () => {
//     console.log(`Server started running on port: ${PORT}`);
//   });
// });





// const express = require("express");
// const cors = require("cors");
// const router = require("./Routes/index"); // Import your main router
// const connectDB = require("./DBConfig");

// const app = express();
// app.use(cors());
// app.use(express.json({ limit: "50mb" }));



// app.use("/api/v1", router);

// console.log("Registered routes:");
// router.stack.forEach((layer) => {
//   if (layer.route) {
//     console.log(`${Object.keys(layer.route.methods).join(",").toUpperCase()} ${layer.route.path}`);
//   }
// });


// // Global error handler
// app.use((err, req, res, next) => {
//   res.locals.error = err;
//   console.log(err);
//   const statusCode = err.status || 500; // Default to 500 if no status is set
//   res.status(statusCode).send({
//     message: err.message || "Internal Server Error",
//   });
// });

// // Start server after connecting to the database
// const PORT = process.env.PORT || 3000;
// connectDB.then(() => {
//   app.listen(PORT, () => {
//     console.log(`Server started running on port: ${PORT}`);
//   });
// });




// const express = require("express");
// const cors = require("cors");
// const router = require("./Routes/index"); // Import default routes
// const manageSubscriptionRouter = require("./Routes/manageSubscription.routes"); // Import subscription management routes

// const connectDB = require("./DBConfig");

// const app = express();

// // Middleware
// app.use(cors());
// app.use(express.json({ limit: "50mb" }));

// // Route Initialization
// app.use("/api/v1", router); // Register default routes
// app.use("/api/v1/manage-subscriptions", manageSubscriptionRouter); // Register subscription routes

// // Error Handling Middleware
// app.use((err, req, res, next) => {
//   console.log(err);
//   const statusCode = err.status || 500; // Default to 500 if no status is set
//   res.status(statusCode).send({
//     message: err.message || "Internal Server Error",
//   });
// });

// // Server Initialization
// const PORT = process.env.PORT || 3000;
// connectDB.then(() => {
//   app.listen(PORT, () => {
//     console.log(`Server started running on port: ${PORT}`);
//   });
// });





// const express = require("express");
// const cors = require("cors");
// const router = require("./Routes/index"); // Import default routes
// const manageSubscriptionRouter = require("./Routes/manageSubscription.routes"); // Import subscription management routes

// const connectDB = require("./DBConfig");

// const app = express();

// // Middleware
// app.use(cors());
// app.use(express.json({ limit: "50mb" }));

// // Route Initialization
// app.use("/api/v1", router); // Register default routes
// app.use("/api/v1/manage-subscriptions", manageSubscriptionRouter); // Register subscription routes

// // Error Handling Middleware (For unmatched routes or other errors)
// app.use((req, res, next) => {
//   res.status(404).send({
//     message: `Route ${req.originalUrl} not found`,
//   });
// });

// // General Error Handling Middleware
// app.use((err, req, res, next) => {
//   console.error(err.stack); // Log error details for debugging
//   const statusCode = err.status || 500; // Default to 500 if no status is set
//   res.status(statusCode).send({
//     message: err.message || "Internal Server Error",
//   });
// });

// // Server Initialization
// const PORT = process.env.PORT || 3000;
// connectDB.then(() => {
//   app.listen(PORT, () => {
//     console.log(`Server started running on port: ${PORT}`);  });
// });


const express = require("express");
const cors = require("cors");
const router = require("./Routes/index");
const connectDB = require("./DBConfig");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use("/api/v1", router)

app.use((err, req, res, next) => {
  res.locals.error = err;
  console.log(err);
  const statusCode = err.status || 500; // Default to 500 if no status is set
  res.status(statusCode).send({
      message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 3000
connectDB.then(() => {
  app.listen(PORT, () => {
    console.log(`Server started running on port: ${PORT}`);
  });
});