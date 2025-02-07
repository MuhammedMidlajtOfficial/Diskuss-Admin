const UserSubscription = require('../models/userSubscription.model');
const EnterpriseUser = require('../models/enterpriseUser');
const User = require('../models/individualUser');

/**
 * Find all user subscriptions with user details.
 * @returns {Promise<Object[]>}
 */
const findAllWithUserDetails = async (page = 1, limit = 10, status, sortBy = 'createdAt', sortOrder = 'asc', search = '') => {
  try {
    const skip = (page - 1) * limit;

    // Build the filter query
    let filter = {};
    if (status) filter.status = status;

    // If search is provided, modify the query to match users first
    let userFilter = {};
    if (search) {
      const searchRegex = new RegExp(search, 'i'); // Case-insensitive search
      userFilter = {
        $or: [
          { companyName: searchRegex },  // EnterpriseUser field
          { username: searchRegex },     // Individual User field
          { email: searchRegex },
        ]
      };
    }

    // Find matching users from both EnterpriseUser & User collections
    const matchedEnterpriseUsers = await EnterpriseUser.find(userFilter).select('_id').exec();
    const matchedIndividualUsers = await User.find(userFilter).select('_id').exec();

    // Extract matching user IDs
    const matchedUserIds = [...matchedEnterpriseUsers, ...matchedIndividualUsers].map(user => user._id);

    // Apply user filter if search is present
    if (search) filter.userId = { $in: matchedUserIds };

    // Sorting order
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Fetch total count after filtering
    const totalSubscriptions = await UserSubscription.countDocuments(filter);

    // Fetch paginated subscriptions
    const subscriptions = await UserSubscription.find(filter)
      .populate('planId') // Populate plan details if needed
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .exec();

    // Fetch user details for each subscription
    const subscriptionsWithDetails = await Promise.all(
      subscriptions.map(async (subscription) => {
        const userId = subscription.userId;

        // Fetch user details from EnterpriseUser or User collection
        const enterpriseUser = await EnterpriseUser.findById(userId).exec();
        const individualUser = await User.findById(userId).exec();

        const userDetails = enterpriseUser || individualUser;

        return {
          subscription,
          user: userDetails
            ? {
                name: enterpriseUser ? enterpriseUser.companyName : individualUser.username,
                image: userDetails.image,
                email: userDetails.email,
                phnNumber: userDetails.phnNumber,
                address: userDetails.address,
              }
            : null,
        };
      })
    );

    return {
      totalSubscriptions,
      totalPages: Math.ceil(totalSubscriptions / limit),
      currentPage: page,
      subscriptions: subscriptionsWithDetails,
    };
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
            phnNumber: userDetails.phnNumber,
            address: userDetails.address,
          }
        : null,
    };
  } catch (error) {
    console.error('Error fetching subscription by ID with user details:', error);
    throw error;
  }
};

const getSubscriptionAmounts = async () => {
  try {
    // Fetch all subscriptions where `payment.netAmount` exists
    const subscriptions = await UserSubscription.find({ "payment.netAmount": { $exists: true } }).exec();

    // if (!subscriptions || subscriptions.length === 0) {
    //   throw new Error('No subscriptions found');
    // }

    // Initialize revenue variables
    let totalRevenue = 0;
    let pendingPayments = 0;
    let completedTransactions = 0;

    // Iterate over subscriptions to calculate values
    subscriptions.forEach(subscription => {
      if (subscription.payment && subscription.payment.length > 0) {
        const netAmount = subscription.payment[0]?.netAmount || 0; // Safely access netAmount

        totalRevenue += netAmount;

        if (subscription.status === 'pending') {
          pendingPayments += netAmount;
        } else if (subscription.status === 'active') {
          completedTransactions += netAmount;
        }
      }
    });

    return {
      totalRevenue,
      pendingPayments,
      completedTransactions
    };
  } catch (error) {
    console.error('Error fetching subscription amounts:', error);
    throw error;
  }
};

/**
 * Update the status of a specific subscription by ID.
 * @param {String} subscriptionId
 * @param {String} newStatus
 * @returns {Promise<Object>}
 */
const updateSubscriptionStatus = async (subscriptionId, newStatus) => {
  try {
      const validStatuses = ['active', 'inactive', 'canceled', 'pending', 'failed'];
      if (!validStatuses.includes(newStatus)) {
          throw new Error('Invalid status value');
      }

      const subscription = await UserSubscription.findByIdAndUpdate(
          subscriptionId,
          { status: newStatus },
          { new: true, runValidators: true }
      ).exec();

      if (!subscription) {
          throw new Error('Subscription not found');
      }

      return subscription;
  } catch (error) {
      console.error('Error updating subscription status:', error);
      throw error;
  }
};

module.exports = {
  findAllWithUserDetails,
  findByIdWithUserDetails,
  updateSubscriptionStatus,
  getSubscriptionAmounts
};
