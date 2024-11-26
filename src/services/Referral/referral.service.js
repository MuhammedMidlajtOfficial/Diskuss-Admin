const Referral = require("../../models/referral.model");
const User = require("../../models/individualUser");
const mongoose = require("mongoose");

// Get Referral Details
const getUserDetails = async (userId) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid userId");
    }

    const user = await User.findById(userId)
        .populate("contacts", "username email") // Populate contacts with username and email
        .populate("invitedUsers", "username email"); // Populate invited users similarly

    if (!user) {
        throw new Error("User not found");
    }

    return user;
};

module.exports = {
    getUserDetails,
};
