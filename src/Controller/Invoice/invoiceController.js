const UserSubscription = require("../../models/userSubscription.model");

async function getInvoices(req, res) {
  try {
    const { limit = 10, filter, startDate, endDate } = req.query;


    let dateFilter = {}; // Default: No filter applied (return all invoices)
    const currentDate = new Date();

    if (filter === 'lastDay') {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(currentDate.getDate() - 1);
      dateFilter = { createdAt: { $gte: oneDayAgo } };
    } else if (filter === 'lastWeek') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(currentDate.getDate() - 7);
      dateFilter = { createdAt: { $gte: sevenDaysAgo } };
    } else if (filter === 'lastMonth') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(currentDate.getDate() - 30);
      dateFilter = { createdAt: { $gte: thirtyDaysAgo } };
    } else if (startDate && endDate) {
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setDate(adjustedEndDate.getDate() + 1); 
      dateFilter = { createdAt: { $gte: new Date(startDate), $lte: adjustedEndDate } };

    }

    // Total number of invoices (useful for count)
    const totalInvoices = await UserSubscription.countDocuments(dateFilter);

    // Fetching the most recent invoices, sorted by payment date
    const invoices = await UserSubscription.find(dateFilter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .populate({ path: "planId", select: ["name","price"] }) // Include plan name

      .populate({ path: "userId", select: ["username", "email","phnNumber"] }); // Include user name and email

    // Mapping through the invoices and ensuring all required fields are included
    const formattedInvoices = invoices.map((invoice) => ({
      invoiceNumber: invoice._id, 
      userId: invoice.userId?._id || "unknown", 
      username: invoice.userId?.username || "unknown", // This should be static 
      userEmail: invoice.userId?.email || "unknown", // This should be static 
      contact:invoice.userId?.phnNumber || "unknown",
      planId: invoice.planId?._id || "unknown", 
      planName: invoice.planId?.name || "unknown", 
      razorpayOrderId: invoice.razorpayOrderId || "unknown", 
      amount: invoice.planId?.price || "unknown", // Default value if amount is not in the model

      paymentMethod: invoice.payment?.[0] || "unknown", // Payment method from payment array (unknown type)
      paymentDate: invoice.createdAt || "unknown", // CreatedAt from timestamps
      subscriptionStartDate: invoice.startDate || "unknown", 
      subscriptionEndDate: invoice.endDate || "unknown", 
      status: invoice.status || "active", // Default status if not available in the model

    }));


    res.status(200).json({
      success: true,
      totalInvoices: totalInvoices,

      invoices: formattedInvoices,
    });
  } catch (error) {
    console.error("Error fetching invoices:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

module.exports = { getInvoices };
