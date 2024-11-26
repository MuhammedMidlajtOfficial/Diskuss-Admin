// const express = require('express');
// const controller = require('../controllers/manageSubscription.controller');

// const router = express.Router();

// router.post('/add', controller.addSubscription); // Add a new subscription
// router.get('/active', controller.getActiveSubscriptions); // Get active subscriptions
// router.get('/inactive', controller.getInactiveSubscriptions); // Get inactive subscriptions

// module.exports = router;




// const express = require("express");
// const manageSubscriptionController = require("../Controller/Dashboard/manageSubscription.controller");
// const { getManageSubscription } = require('../Controller/Dashboard/manageSubscription.controller');


// const router = express.Router();

// // Define routes for managing subscriptions
// router.post("/add", manageSubscriptionController.addSubscription); // Add subscription
// router.get("/active", manageSubscriptionController.getActiveSubscriptions); // Get active subscriptions
// router.get("/inactive", manageSubscriptionController.getInactiveSubscriptions); // Get inactive subscriptions

// module.exports = router;



const express = require("express");
const manageSubscriptionController = require("../Controller/Dashboard/manageSubscription.controller");

const router = express.Router();

// Define routes for managing subscriptions

// Add a new subscription
router.post("/add", manageSubscriptionController.addSubscription);

// Get all active subscriptions
router.get("/active", manageSubscriptionController.getActiveSubscriptions);

// Get all inactive subscriptions
router.get("/inactive", manageSubscriptionController.getInactiveSubscriptions);

// Update subscription status (active/inactive)
router.patch("/:id/status", manageSubscriptionController.updateSubscriptionStatus);

module.exports = router;
