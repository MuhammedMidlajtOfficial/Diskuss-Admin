const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const SubscriptionPlanSchema = new mongoose.Schema({
  planId: { type: String, default: uuidv4, unique: true },
  name: { type: String, required: true, maxlength: 100 },
  price: { type: mongoose.Schema.Types.Decimal128, required: true },
  features: { type: mongoose.Schema.Types.Mixed, default: {} }, // Flexible JSON format
  duration : { type: Number, required: true },

}, { timestamps: true });

// // Middleware to ensure only one membership type is active
// subscriptionPlanSchema.pre("save", function (next) {
//   // Track active membership flags
//   const memberships = [this.isDiamond, this.isGold, this.isSilver, this.isTrial];
//   const activeMemberships = memberships.filter(Boolean);

//   if (activeMemberships.length > 1) {
//     return next(new Error("Only one membership level can be active per plan."));
//   }
  
//   next();
// });



const getActiveSubscriptions = async (req, res) => {
  try {
    const activeSubscriptions = await ManageSubscription.find({ subscriptionStatus: 'active' })
      .populate('planId', 'name price features duration')  // Populate subscription plan details
      .exec();

    res.status(200).json(activeSubscriptions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching active subscriptions", error: error });
  }
};



const getInactiveSubscriptions = async (req, res) => {
  try {
    const inactiveSubscriptions = await ManageSubscription.find({ subscriptionStatus: 'inactive' })
      .populate('planId', 'name price features duration')  // Populate subscription plan details
      .exec();

    res.status(200).json(inactiveSubscriptions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching inactive subscriptions", error: error });
  }
};


module.exports = mongoose.model("SubscriptionPlan", SubscriptionPlanSchema);