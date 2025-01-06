const { Router } = require("express");
const {
  getSubscriptionPlans,
  getSubscriptionPlanById,
  getSubscriptionPlanByPlanId,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  updateSubscriptionPlanStatus,
  deleteSubscriptionPlan,
} = require("../../Controller/PaymentManagement/SubscriptionPlanController");

const router = Router();

// Route to get all subscription plans
router.get("/", getSubscriptionPlans);

// Route to get a subscription plan by its database ID
router.get("/:id", getSubscriptionPlanById);

// Route to get a subscription plan by its custom plan ID
router.get("/plan/:plan_id", getSubscriptionPlanByPlanId);

// Route to create a new subscription plan
router.post("/", createSubscriptionPlan);

// Route to update a subscription plan by its custom plan ID
router.put("/:plan_id", updateSubscriptionPlan);

//Route to Update status of the Subscription
router.patch('/:plan_id/status',updateSubscriptionPlanStatus );

// Route to delete a subscription plan by its custom plan ID
router.delete("/:plan_id", deleteSubscriptionPlan);

module.exports = router;
