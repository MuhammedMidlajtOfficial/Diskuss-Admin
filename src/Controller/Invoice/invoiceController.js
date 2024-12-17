const UserSubscription = require("../../models/userSubscription.model");

async function getInvoices(req, res) {
  try {
    const { page = 1, limit = 10, filter, startDate, endDate } = req.query;

    let dateFilter = {}; // Default: No filter applied (return all invoices)
    const currentDate = new Date();

    if (filter === 'lastDay') {
      dateFilter = { createdAt: { $gte: new Date(currentDate - 24 * 60 * 60 * 1000) } };
    } else if (filter === 'lastWeek') {
      dateFilter = { createdAt: { $gte: new Date(currentDate - 7 * 24 * 60 * 60 * 1000) } };
    } else if (filter === 'lastMonth') {
      dateFilter = { createdAt: { $gte: new Date(currentDate - 30 * 24 * 60 * 60 * 1000) } };
    } else if (startDate && endDate) {
      dateFilter = { createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) } };
    }

    // Total number of invoices (useful for count)
    const totalInvoices = await UserSubscription.countDocuments(dateFilter);

    // Fetching the most recent invoices, sorted by payment date
    const invoices = await UserSubscription.find(dateFilter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate({ path: "planId", select: "name" }) // Include plan name
      .populate({ path: "userId", select: ["username", "email","phnNumber"] }); // Include user name and email

    // Mapping through the invoices and ensuring all required fields are included
    const formattedInvoices = invoices.map((invoice) => ({
      invoiceNumber: invoice._id, 
      userId: invoice.userId?._id || "unknown", 
      userName: invoice.userId?.username || "unknown", // This should be static 
      userEmail: invoice.userId?.email || "unknown", // This should be static 
      contact:invoice.userId?.phnNumber || "unknown",
      planId: invoice.planId?._id || "unknown", 
      planName: invoice.planId?.name || "unknown", 
      razorpayOrderId: invoice.razorpayOrderId || "unknown", 
      amount: invoice.amount || "unknown", // Default value if amount is not in the model
      paymentMethod: invoice.payment?.[0] || "unknown", // Payment method from payment array (unknown type)
      paymentDate: invoice.createdAt || "unknown", // CreatedAt from timestamps
      subscriptionStartDate: invoice.startDate || "unknown", 
      subscriptionEndDate: invoice.endDate || "unknown", 
      status: invoice.paymentStatus || "success", // Default status if not available in the model
    }));


    res.status(200).json({
      success: true,
      page: Number(page),
      totalInvoices: totalInvoices,
      totalPages: Math.ceil(totalInvoices / limit),
      invoices: formattedInvoices,
    });
  } catch (error) {
    console.error("Error fetching invoices:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

module.exports = { getInvoices };
