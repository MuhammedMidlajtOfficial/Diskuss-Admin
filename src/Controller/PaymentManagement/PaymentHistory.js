const { findAllWithUserDetails, findByIdWithUserDetails ,updateSubscriptionStatus} = require('../../services/userSubscription.service');

/**
 * Get all user subscriptions with user details.
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
const getAllUserSubscriptionsWithDetails = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = "",
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search = ''
    } = req.query;

    const subscriptionsData = await findAllWithUserDetails(page, limit, status, sortBy, sortOrder, search);

    return res.status(200).json(subscriptionsData);
  } catch (error) {
    console.error('Error fetching all subscriptions with details:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Get a specific user subscription by ID with user details.
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
const getUserSubscriptionByIdWithDetails = async (req, res) => {
    try {
      const { subscription_id } = req.params;
      const subscription = await findByIdWithUserDetails(subscription_id);
      return res.status(200).json(subscription);
    } catch (error) {
      console.error('Error fetching subscription by ID with details:', error);
      return res.status(500).json({ error: error.message });
    }
  };
  

  const updateUserSubscriptionStatus = async (req, res) => {
      try {
          const { subscription_id } = req.params;
          const { status } = req.body;
  
          const updatedSubscription = await updateSubscriptionStatus(subscription_id, status);
  
          return res.status(200).json(updatedSubscription);
      } catch (error) {
          console.error('Error updating subscription status:', error);
          return res.status(500).json({ error: error.message });
      }
  };
  

  module.exports = {
    getAllUserSubscriptionsWithDetails,
    getUserSubscriptionByIdWithDetails,
    updateUserSubscriptionStatus
  };
  