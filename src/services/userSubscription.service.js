const UserSubscription = require('../models/userSubscription.model');
const EnterpriseUser = require('../models/enterpriseUser');
const User = require('../models/individualUser');

/**
 * Find all user subscriptions with user details.
 * @returns {Promise<Object[]>}
 */
const findAllWithUserDetails = async () => {
  try {
    const subscriptions = await UserSubscription.find()
      .populate('planId') // Populate plan details if needed
      .exec();

    // Add user details for each subscription
    const subscriptionsWithDetails = await Promise.all(
      subscriptions.map(async (subscription) => {
        const userId = subscription.userId;

        // Fetch user details from the appropriate collection
        const enterpriseUser = await EnterpriseUser.findById(userId).exec();
        const individualUser = await User.findById(userId).exec();

        const userDetails = enterpriseUser || individualUser;

        // Standardize the response format
        return {
          subscription,
          user: userDetails
            ? {
                name: enterpriseUser ? enterpriseUser.companyName : individualUser.username,
                image: userDetails.image,
                email: userDetails.email,
                phoneNumber: userDetails.phnNumber,
                address: userDetails.address,
              }
            : null,
        };
      })
    );

    return subscriptionsWithDetails;
  } catch (error) {
    console.error('Error fetching all subscriptions with user details:', error);
    throw error;
  }
};

/**
 * Find a specific subscription by ID with user details.
 * @param {String} subscriptionId
 * @returns {Promise<Object>}
 */
const findByIdWithUserDetails = async (subscriptionId) => {
  try {
    const subscription = await UserSubscription.findById(subscriptionId)
      .populate('planId') // Populate plan details if needed
      .exec();

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const userId = subscription.userId;

    // Fetch user details from the appropriate collection
    const enterpriseUser = await EnterpriseUser.findById(userId).exec();
    const individualUser = await User.findById(userId).exec();

    const userDetails = enterpriseUser || individualUser;

    // Standardize the response format
    return {
      subscription,
      user: userDetails
        ? {
            name: enterpriseUser ? enterpriseUser.companyName : individualUser.username,
            image: userDetails.image,
            email: userDetails.email,
            phoneNumber: userDetails.phnNumber,
            address: userDetails.address,
          }
        : null,
    };
  } catch (error) {
    console.error('Error fetching subscription by ID with user details:', error);
    throw error;
  }
};

module.exports = {
  findAllWithUserDetails,
  findByIdWithUserDetails,
};
