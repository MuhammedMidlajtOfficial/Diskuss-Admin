const { Router } = require('express');
const {
  getAllUserSubscriptionsWithDetails,
  getUserSubscriptionByIdWithDetails,
  updateUserSubscriptionStatus
} = require('../../Controller/PaymentManagement/PaymentHistory');

const router = Router();

// Get all subscriptions with user details
router.get('/', getAllUserSubscriptionsWithDetails);

// Get a specific subscription by ID with user details
router.get('/:subscription_id', getUserSubscriptionByIdWithDetails);

//Patch a Subscriptions with Id
router.patch('/:subscription_id/status', updateUserSubscriptionStatus);

module.exports = router;
