const card = require("../../models/card");
const enterpriseEmployeCard = require("../../models/enterpriseEmployeCard.model");
const enterpriseEmployeModel = require("../../models/enterpriseEmploye.model");
const enterpriseUser = require("../../models/enterpriseUser");
const individualUser = require("../../models/individualUser");
const subscriptionPlanModel = require("../../models/subscriptionPlan.model");
const userSubscriptionModel = require("../../models/userSubscription.model");


module.exports.getTotalCount = async (req, res) => {
    try {
      const IndividualUserCount = await individualUser.countDocuments();
      const EnterpriseUser = await enterpriseUser.countDocuments();
      const enterpriseEmploye = await enterpriseEmployeModel.countDocuments();
      
      const totalUser = IndividualUserCount + EnterpriseUser + enterpriseEmploye
      return res.status(200).json({ totalUser })
    } catch (error) {
      console.error('Error during login:', error);
      return res.status(500).json({ message: 'Server error' });
    }
};

module.exports.getIndividualUsersCount = async (req, res) => {
    try {
        const user = await individualUser.countDocuments();
        return res.status(200).json({user})
    } catch (error) {
      console.error('Error during login:', error);
      return res.status(500).json({ message: 'Server error' });
    }
};

module.exports.getEnterpriseUsersCount = async (req, res) => {
    try {
        const user = await enterpriseUser.countDocuments();
        return res.status(200).json({user})
    } catch (error) {
      console.error('Error during login:', error);
      return res.status(500).json({ message: 'Server error' });
    }
};

module.exports.getEnterpriseEmployeeCount = async (req, res) => {
    try {
        const user = await enterpriseEmployeModel.countDocuments();
        return res.status(200).json({user})
    } catch (error) {
      console.error('Error during login:', error);
      return res.status(500).json({ message: 'Server error' });
    }
};

module.exports.getTotalCards = async (req, res) => {
  try {
      const empCards = await enterpriseEmployeCard.countDocuments();
      const cards = await card.countDocuments();
      const cardCount = empCards+cards
      return res.status(200).json({ cardCount })
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports.getNewUsers = async (req, res) => {
  try {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // Query to count documents created after oneMonthAgo
    const IndividualUserCount = await individualUser.countDocuments({ createdAt: { $gte: oneMonthAgo } });
    const EnterpriseUser = await enterpriseUser.countDocuments({ createdAt: { $gte: oneMonthAgo } });
    const enterpriseEmploye = await enterpriseEmployeModel.countDocuments({ createdAt: { $gte: oneMonthAgo } });

    const newUsers = IndividualUserCount + EnterpriseUser + enterpriseEmploye
    return res.status(200).json({ newUsers })
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports.getSubscribedUsers = async (req, res) => {
  try {
    const subscribedUsers = await userSubscriptionModel.countDocuments({ status: 'active' });
    
    return res.status(200).json({ subscribedUsers })
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports.getFailedPayment = async (req, res) => {
  try {
    const failedPaymentCount = await userSubscriptionModel.countDocuments({ status: { $in: ['failed', 'pending'] } });
    return res.status(200).json({ failedPaymentCount })
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports.getActiveUsers = async (req, res) => {
  try {
    const uniqueSubscribedUsers = await userSubscriptionModel.distinct('userId', { status: 'active' });
    const activeUsersCount = uniqueSubscribedUsers.length;

    return res.status(200).json({ activeUsersCount });
  } catch (error) {
    console.error('Error while fetching subscribed users:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports.getJobOverviewData = async (req, res) => {
  try {
    const years = [2024, 2025, 2026];
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    // Create an array to store the aggregated data
    const jobOverviewData = [];

    for (let i = 0; i < months.length; i++) {
      const month = months[i];
      const monthlyData = { month };

      for (let j = 0; j < years.length; j++) {
        const year = years[j];

        // Aggregate counts per month for each year
        const count = await aggregateUserCountForMonth(year, month);
        // console.log(`Year: ${year}, Month: ${month}, Count: ${count}`); // Log the count for debugging
        monthlyData[year] = count; // Add the count for the respective year
      }

      jobOverviewData.push(monthlyData); // Push the month and counts for each year
    }

    return res.status(200).json({ jobOverviewData });
    
  } catch (error) {
    console.error('Error fetching job overview data:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

async function aggregateUserCountForMonth(year, month) {
  // Normalize the startDate to the first day of the month at midnight
  const startDate = new Date(`${year}-${formatMonth(month)}-01T00:00:00.000Z`);
  
  // Normalize the endDate to the last day of the month at just before midnight of the next month
  const nextMonth = new Date(startDate);
  nextMonth.setMonth(startDate.getMonth() + 1); // Move to next month
  const endDate = new Date(nextMonth);
  endDate.setMilliseconds(endDate.getMilliseconds() - 1); // Subtract 1ms to get the last moment of the current month

  // Log to verify
  // console.log(`Start Date for ${month} ${year}:`, startDate);
  // console.log(`End Date for ${month} ${year}:`, endDate);

  // Query individual users
  const individualCount = await individualUser.countDocuments({
    createdAt: {
      $gte: startDate,
      $lt: endDate
    }
  });
  
  // Query enterprise users
  const enterpriseCount = await enterpriseUser.countDocuments({
    createdAt: {
      $gte: startDate,
      $lt: endDate
    }
  });
  
  // Query enterprise employees
  const enterpriseEmployeCount = await enterpriseEmployeModel.countDocuments({
    createdAt: {
      $gte: startDate,
      $lt: endDate
    }
  });

  // console.log('individualCount:', individualCount);
  // console.log('enterpriseCount:', enterpriseCount);
  // console.log('enterpriseEmployeCount:', enterpriseEmployeCount);

  // Return the total count for that month and year
  return individualCount + enterpriseCount + enterpriseEmployeCount;
}

function formatMonth(month) {
  // Map month name to corresponding number in two-digit format (01-12)
  const monthMap = {
    "Jan": "01",
    "Feb": "02",
    "Mar": "03",
    "Apr": "04",
    "May": "05",
    "Jun": "06",
    "Jul": "07",
    "Aug": "08",
    "Sep": "09",
    "Oct": "10",
    "Nov": "11",
    "Dec": "12"
  };
  return monthMap[month];
}

module.exports.getTodaysActiveUsers = async (req, res) => {
  try {
    // Step 1: Get the date from the URL parameter
    const { date } = req.params;

    // Step 2: Validate the date format (yyyy-mm-dd)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ message: 'Invalid date format. Use yyyy-mm-dd.' });
    }

    // Step 3: Convert the date to start of the day and end of the day
    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    
    if (isNaN(startOfDay) || isNaN(endOfDay)) {
      return res.status(400).json({ message: 'Invalid date provided.' });
    }

    startOfDay.setHours(0, 0, 0, 0);  // Set to 00:00:00 of that day
    endOfDay.setHours(23, 59, 59, 999);  // Set to 23:59:59.999 of that day

    // console.log('Start of day:', startOfDay);
    // console.log('End of day:', endOfDay);

    // Step 4: Fetch users created on the given date, use createdAt field
    const individualUsers = await individualUser.find({
      createdAt: { $gte: startOfDay, $lt: endOfDay }
    });

    const enterpriseUsers = await enterpriseUser.find({
      createdAt: { $gte: startOfDay, $lt: endOfDay }
    });

    const enterpriseEmployees = await enterpriseEmployeModel.find({
      createdAt: { $gte: startOfDay, $lt: endOfDay }
    });

    // Step 5: Combine all the results into one array
    const activeUsers = [...individualUsers, ...enterpriseUsers, ...enterpriseEmployees];

    // Step 6: Send the response with the count of active users
    return res.status(200).json({ activeUsers });
    
  } catch (error) {
    console.error('Error while fetching active users:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports.getPlanMembers = async (req, res) => {
  try {
    // Step 1: Get the date from the URL parameter
    const { date } = req.params;

    // Step 2: Validate the date format (yyyy-mm-dd)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ message: 'Invalid date format. Use yyyy-mm-dd.' });
    }

    // Step 3: Convert the date to start of the day and end of the day
    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    
    if (isNaN(startOfDay) || isNaN(endOfDay)) {
      return res.status(400).json({ message: 'Invalid date provided.' });
    }

    startOfDay.setHours(0, 0, 0, 0);  // Set to 00:00:00 of that day
    endOfDay.setHours(23, 59, 59, 999);  // Set to 23:59:59.999 of that day

    // console.log('Start of day:', startOfDay);
    // console.log('End of day:', endOfDay);

    const plansAvailable = await subscriptionPlanModel.find();  // Fetch all available plans

    // Step 4: Fetch users created on the given date, use createdAt field
    const subscribedMembers = await userSubscriptionModel.find({
      createdAt: { $gte: startOfDay, $lt: endOfDay }
    });

    // Step 5: Map planIds to plan names for easy reference
    const planMap = plansAvailable.reduce((acc, plan) => {
      acc[plan._id.toString()] = plan.name;  // Assuming `name` is the plan name and `_id` is the plan ID
      return acc;
    }, {});

    // Step 6: Calculate the count of users for each plan
    const planUsage = {};

    // Count users for each plan by plan name
    subscribedMembers.forEach((member) => {
      const planId = member.planId.toString();  // Assuming `planId` is the field storing the plan reference
      const planName = planMap[planId] || 'Unknown Plan';  // Map planId to planName
      if (planUsage[planName]) {
        planUsage[planName]++;
      } else {
        planUsage[planName] = 1;
      }
    });

    // Step 7: Calculate the percentage for each plan
    const totalMembers = subscribedMembers.length;
    const planPercentage = plansAvailable.map((plan) => {
      const planName = plan.name;
      const planCount = planUsage[planName] || 0;  // Ensure the plan is included even if no users are subscribed
      const planPercent = totalMembers ? ((planCount / totalMembers) * 100).toFixed(2) : 0;
      return {
        planName: planName,
        count: planCount,
        percentage: planPercent,
      };
    });

    // Step 8: Send the response with the counts and percentages
    return res.status(200).json({ planPercentage });

  } catch (error) {
    console.error('Error while fetching active users:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports.getUserPercentage = async (req, res) => {
  try {
    // Get current date
    const now = new Date();

    // Get start and end of the current month
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfCurrentMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1, 0, 23, 59, 59, 999
    );

    // console.log('startOfCurrentMonth', startOfCurrentMonth);
    // console.log('endOfCurrentMonth', endOfCurrentMonth);

    // Get end of the previous month
    const endOfPreviousMonth = new Date(
      now.getFullYear(),
      now.getMonth(), 0, 23, 59, 59, 999
    );

    // Step 1: Fetch users from this month
    const thisMonthUsers = [
      ...(await individualUser.find({
        createdAt: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth },
      })),
      ...(await enterpriseUser.find({
        createdAt: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth },
      })),
      ...(await enterpriseEmployeModel.find({
        createdAt: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth },
      })),
    ];

    // console.log('thisMonthUsers:', thisMonthUsers.length);

    // Fetch users from the previous months
    const individualUsers = await individualUser.find({
      createdAt: { $lt: endOfPreviousMonth },
    });

    const enterpriseUsers = await enterpriseUser.find({
      createdAt: { $lt: endOfPreviousMonth },
    });

    const enterpriseEmployees = await enterpriseEmployeModel.find({
      createdAt: { $lt: endOfPreviousMonth },
    });

    const previousMonthsUsers = [
      ...individualUsers,
      ...enterpriseUsers,
      ...enterpriseEmployees,
    ];

    // Calculate the start and end of the previous month
    const endOflastMonth = new Date(now.getFullYear(), now.getMonth(), 0); // Last day of the last month
    const startOflastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1); // First day of the last month

    // Fetch users from the last month (from the start to the end of the last month)
    const individualUsersLastMonth = await individualUser.find({
      createdAt: { $gte: startOflastMonth, $lt: endOflastMonth },
    });

    const enterpriseUsersLastMonth = await enterpriseUser.find({
      createdAt: { $gte: startOflastMonth, $lt: endOflastMonth },
    });

    const enterpriseEmployeesLastMonth = await enterpriseEmployeModel.find({
      createdAt: { $gte: startOflastMonth, $lt: endOflastMonth },
    });

    // Combine all users from the last month
    const lastMonthsUsers = [
      ...individualUsersLastMonth,
      ...enterpriseUsersLastMonth,
      ...enterpriseEmployeesLastMonth,
    ];

    // Total users
    const totalUsers = thisMonthUsers.length + previousMonthsUsers.length;

    // Step 3: Calculate percentages
    const thisMonthPercentage = (thisMonthUsers.length / totalUsers) * 100;
    const previousMonthsPercentage =
      (previousMonthsUsers.length / totalUsers) * 100;

    // Step 4: Calculate growth/loss percentage
    let growthLoss = 0;
    if (thisMonthUsers.length + previousMonthsUsers.length > 0) {
      growthLoss =
        (thisMonthUsers.length /
          (thisMonthUsers.length + lastMonthsUsers.length)) *
        100;
    }

    // Step 5: Return the result
    return res.status(200).json({ 
      userData: {
        totalUsers,
        thisMonthUsers: thisMonthUsers.length,
        previousMonthsUsers: previousMonthsUsers.length,
        thisMonthPercentage: thisMonthPercentage.toFixed(2),
        previousMonthsPercentage: previousMonthsPercentage.toFixed(2),
        growthLoss: growthLoss.toFixed(2), // Positive for growth, negative for loss
      }
    });
  } catch (error) {
    console.error('Error while calculating user percentages:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports.getRecentRegister = async (req, res) => {
  try {
    const { user } = req.params
    let enterpriseUsers = [];
    let enterpriseEmployees = [];
    let individualUsers = [];
   
    if(user == 'enterpriseUsers'){
      // Fetch enterprise users, sorted by createdAt in descending order
      enterpriseUsers = await enterpriseUser
        .find()
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
      // console.log('Latest Enterprise Users:', enterpriseUsers.length);
    } else if(user == 'enterpriseEmployees'){ 
      // Fetch enterprise employees, sorted by createdAt in descending order
      enterpriseEmployees = await enterpriseEmployeModel
        .find()
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
      // console.log('Latest Enterprise Employees:', enterpriseEmployees.length);
    }else if(user == 'individualUsers'){
      // Fetch individual users, sorted by createdAt in descending order
      individualUsers = await individualUser
      .find()
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
      // console.log('Latest Individual Users:', individualUsers.length);
    }

    // Combine all users, sort by createdAt, and add timePassed field
    const allUsers = [...individualUsers, ...enterpriseUsers, ...enterpriseEmployees]
      .map(user => {
        const createdAt = user.createdAt ? new Date(user.createdAt) : null;

        let timePassed = 'Date not available';
        if (createdAt) {
          const now = new Date();
          const diffMs = now - createdAt;

          if (diffMs < 1000 * 60) {
            // Less than a minute ago
            timePassed = `${Math.floor(diffMs / 1000)} seconds ago`;
          } else if (diffMs < 1000 * 60 * 60) {
            // Less than an hour ago
            timePassed = `${Math.floor(diffMs / (1000 * 60))} minutes ago`;
          } else if (diffMs < 1000 * 60 * 60 * 24) {
            // Less than a day ago
            timePassed = `${Math.floor(diffMs / (1000 * 60 * 60))} hours ago`;
          } else {
            // More than a day ago
            timePassed = `${Math.floor(diffMs / (1000 * 60 * 60 * 24))} days ago`;
          }
        }
        return {
          ...user,
          timePassed,
        };
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))

      return res.status(200).json({ recentUsers: allUsers });
  } catch (error) {
    console.error('Error fetching latest users:', error.message);
    return res.status(500).json({ message: 'Server error. Could not fetch latest users.' });
  }
};

module.exports.getMostlyUsedPlans = async (req, res) => {
  try {
    // Step 1: Aggregate subscriptions to count usage frequency and calculate the most used plan per user
    const userPlanUsage = await userSubscriptionModel.aggregate([
      {
        $group: {
          _id: { userId: "$userId", planId: "$planId" }, // Group by userId and planId
          planUsageCount: { $sum: 1 }, // Count the number of times each plan is used by the user
        },
      },
      {
        $group: {
          _id: "$_id.userId", // Group by userId
          plans: { $push: { planId: "$_id.planId", count: "$planUsageCount" } }, // Collect plan details with usage count
          planCount: { $sum: "$planUsageCount" }, // Total number of subscriptions by the user
        },
      },
      {
        $project: {
          _id: 1,
          planCount: 1,
          mostUsedPlan: { $arrayElemAt: [{ $sortArray: { input: "$plans", sortBy: { count: -1 } } }, 0] }, // Get the most used plan
        },
      },
      {
        $sort: { planCount: -1 }, // Sort by total subscription count
      },
      {
        $limit: 10, // Get the top 10 users
      },
    ]);

    // Step 2: Fetch user details and populate the most used plan details
    const detailedUserPlanUsage = await Promise.all(
      userPlanUsage.map(async (usage) => {
        // Fetch user details from all models
        const userDetails =
          (await enterpriseUser.findById(usage._id).select("username email image ").lean()) ||
          (await enterpriseEmployeModel.findById(usage._id).select("username email image ").lean()) ||
          (await individualUser.findById(usage._id).select("username email image ").lean()) ||
          { name: "Unknown User", email: "N/A" };

        // Fetch plan details for the most used plan
        const planDetails = await subscriptionPlanModel.findById(usage.mostUsedPlan.planId).select('name').lean();

        return {
          ...userDetails,
          planCount: usage.planCount,
          plansUsed: planDetails || { name: "Unknown Plan", description: "N/A" }, // Populate with plan details or fallback
        };
      })
    );

    // Step 3: Return the response
    return res.status(200).json({ topUsers: detailedUserPlanUsage });
  } catch (error) {
    console.error("Error while fetching mostly used plans:", error.message); // Log error message for better clarity
    return res.status(500).json({ message: "Server error" });
  }
};
