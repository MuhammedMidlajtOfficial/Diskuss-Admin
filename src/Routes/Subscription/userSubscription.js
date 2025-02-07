const { Router } = require('express');
const {
  getAllUserSubscriptionsWithDetails,
  getUserSubscriptionByIdWithDetails,
  updateUserSubscriptionStatus,
  getSubscriptionAmount
} = require('../../Controller/PaymentManagement/PaymentHistory');

const router = Router();

// Get all subscriptions with user details
router.get('/', getAllUserSubscriptionsWithDetails);

router.get('/subscriptionAmount', getSubscriptionAmount);

// Get all subscriptions with user details
router.get('/', getAllUserSubscriptionsWithDetails);

//Patch a Subscriptions with Id
router.patch('/:subscription_id/status', updateUserSubscriptionStatus);

module.exports = router;
