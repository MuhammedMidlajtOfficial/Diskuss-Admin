const card = require("../../models/card");
const enterpriseEmployeModel = require("../../models/enterpriseEmploye.model");
const enterpriseEmployeCard = require("../../models/enterpriseEmployeCard.model");
const enterpriseUser = require("../../models/enterpriseUser");
const { individualUser } = require("../../models/individualUser");
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
        console.log(`Year: ${year}, Month: ${month}, Count: ${count}`); // Log the count for debugging
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
  console.log(`Start Date for ${month} ${year}:`, startDate);
  console.log(`End Date for ${month} ${year}:`, endDate);

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

    console.log('Start of day:', startOfDay);
    console.log('End of day:', endOfDay);

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

module.exports.getSubscribedUsers = async (req, res) => {
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

    console.log('Start of day:', startOfDay);
    console.log('End of day:', endOfDay);

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

