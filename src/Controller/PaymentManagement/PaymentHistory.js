const { findAllWithUserDetails, findByIdWithUserDetails } = require('../../services/userSubscription.service');

/**
 * Get all user subscriptions with user details.
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
const getAllUserSubscriptionsWithDetails = async (req, res) => {
  try {
    const subscriptions = await findAllWithUserDetails();
    return res.status(200).json(subscriptions);
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
  
  module.exports = {
    getAllUserSubscriptionsWithDetails,
    getUserSubscriptionByIdWithDetails,
  };
  