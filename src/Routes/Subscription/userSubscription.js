const { Router } = require('express');
const {
  getAllUserSubscriptionsWithDetails,
  getUserSubscriptionByIdWithDetails,
} = require('../../Controller/PaymentManagement/PaymentHistory');

const router = Router();

// Get all subscriptions with user details
router.get('/', getAllUserSubscriptionsWithDetails);

// Get a specific subscription by ID with user details
router.get('/:subscription_id', getUserSubscriptionByIdWithDetails);

module.exports = router;
