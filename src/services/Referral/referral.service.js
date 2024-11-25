const Referral = require("../../models/referral.model");
const User = require("../../models/individualUser");

// Get Referral Details
const getReferralDetails = async (userId) => {
    const referrals = await Referral.find({ referrer: userId }).select(
        "inviteeEmail status rewardsEarned createdAt"
    );
    const user = await User.findById(userId);
    const coins = user.coins;

    return { coins, invitedUsers: referrals };
};
module.exports = {
    getReferralDetails,
};
