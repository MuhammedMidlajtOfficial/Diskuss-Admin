// const ManageSubscription = require("../models/manageSubscription.model");

// // Add a new subscription
// exports.addSubscription = async (req, res) => {
//     try {
//         const newSubscription = new ManageSubscription(req.body);
//         const savedSubscription = await newSubscription.save();
//         res.status(201).json({ message: "Subscription added successfully", savedSubscription });
//     } catch (error) {
//         console.error("Error adding subscription:", error);
//         res.status(500).json({ message: "Error adding subscription", error });
//     }
// };

// // Get all active subscriptions
// exports.getActiveSubscriptions = async (req, res) => {
//     try {
//         const activeSubscriptions = await ManageSubscription.find({ subscriptionStatus: 'active' })
//             .populate('userId planId');
//         res.status(200).json(activeSubscriptions);
//     } catch (error) {
//         console.error("Error fetching active subscriptions:", error);
//         res.status(500).json({ message: "Error fetching active subscriptions" });
//     }
// };

// // Get all inactive subscriptions
// exports.getInactiveSubscriptions = async (req, res) => {
//     try {
//         const inactiveSubscriptions = await ManageSubscription.find({ subscriptionStatus: 'inactive' })
//             .populate('userId planId');
//         res.status(200).json(inactiveSubscriptions);
//     } catch (error) {
//         console.error("Error fetching inactive subscriptions:", error);
//         res.status(500).json({ message: "Error fetching inactive subscriptions" });
//     }
// };




// const ManageSubscription = require("../Models/manageSubscription.model");

// // Add a new subscription
// exports.addSubscription = async (req, res) => {
//   try {
//     const newSubscription = new ManageSubscription(req.body);
//     const savedSubscription = await newSubscription.save();
//     res.status(201).json({ message: "Subscription added successfully", savedSubscription });
//   } catch (error) {
//     console.error("Error adding subscription:", error);
//     res.status(500).json({ message: "Error adding subscription", error });
//   }
// };

// // Get active subscriptions
// exports.getActiveSubscriptions = async (req, res) => {
//   try {
//     const activeSubscriptions = await ManageSubscription.find({ subscriptionStatus: "active" })
//       .populate("userId planId");
//     res.status(200).json(activeSubscriptions);
//   } catch (error) {
//     console.error("Error fetching active subscriptions:", error);
//     res.status(500).json({ message: "Error fetching active subscriptions", error });
//   }
// };

// // Get inactive subscriptions
// exports.getInactiveSubscriptions = async (req, res) => {
//   try {
//     const inactiveSubscriptions = await ManageSubscription.find({ subscriptionStatus: "inactive" })
//       .populate("userId planId");
//     res.status(200).json(inactiveSubscriptions);
//   } catch (error) {
//     console.error("Error fetching inactive subscriptions:", error);
//     res.status(500).json({ message: "Error fetching inactive subscriptions", error });
//   }
// };




// const ManageSubscription = require('../../models/manageSubscription.model');

// Add a new subscription
// exports.addSubscription = async (req, res) => {
//   try {
//     const newSubscription = new ManageSubscription(req.body);
//     const savedSubscription = await newSubscription.save();
//     res.status(201).json({ message: "Subscription added successfully", savedSubscription });
//   } catch (error) {
//     console.error("Error adding subscription:", error);
//     res.status(500).json({ message: "Error adding subscription", error });
//   }
// };

// exports.addSubscription = async (req, res) => {
//   try {
//     const newSubscription = new ManageSubscription(req.body);
//     const savedSubscription = await newSubscription.save();
//     res.status(201).json({ message: "Subscription added successfully", data: savedSubscription });
//   } catch (error) {
//     res.status(500).json({ message: "Error adding subscription", error });
//   }
// };

// // Get active subscriptions
// exports.getActiveSubscriptions = async (req, res) => {
//   try {
//     const activeSubscriptions = await ManageSubscription.find({ subscriptionStatus: "active" })
//       .populate("userId planId");
//     res.status(200).json(activeSubscriptions);
//   } catch (error) {
//     console.error("Error fetching active subscriptions:", error);
//     res.status(500).json({ message: "Error fetching active subscriptions", error });
//   }
// };

// // Get inactive subscriptions
// exports.getInactiveSubscriptions = async (req, res) => {
//   try {
//     const inactiveSubscriptions = await ManageSubscription.find({ subscriptionStatus: "inactive" })
//       .populate("userId planId");
//     res.status(200).json(inactiveSubscriptions);
//   } catch (error) {
//     console.error("Error fetching inactive subscriptions:", error);
//     res.status(500).json({ message: "Error fetching inactive subscriptions", error });
//   }
// };



const ManageSubscription = require("../../models/manageSubscription.model");

// Add a new subscription
exports.addSubscription = async (req, res) => {
  try {
    const { name, status } = req.body; // Assuming name and status are part of the subscription model
    const newSubscription = new ManageSubscription({ name, status });
    const savedSubscription = await newSubscription.save();

    res.status(201).json({
      message: "Subscription added successfully",
      subscription: savedSubscription,
    });
  } catch (error) {
    res.status(500).json({ message: "Error adding subscription", error });
  }
};



// Get active subscriptions
exports.getActiveSubscriptions = async (req, res) => {
  try {
    const activeSubscriptions = await ManageSubscription.find({ status: "active" });
    res.status(200).json(activeSubscriptions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching active subscriptions", error });
  }
};

// Get inactive subscriptions
exports.getInactiveSubscriptions = async (req, res) => {
  try {
    const inactiveSubscriptions = await ManageSubscription.find({ status: "inactive" });
    res.status(200).json(inactiveSubscriptions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching inactive subscriptions", error });
  }
};

// Update subscription status
exports.updateSubscriptionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const subscription = await ManageSubscription.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    res.status(200).json({
      message: "Subscription status updated successfully",
      subscription,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating subscription status", error });
  }
};
