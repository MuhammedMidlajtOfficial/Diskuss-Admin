const referralService = require("../../services/Referral/referral.service");

// Get Referral Details
const getReferralDetails = async (req, res) => {
    try {
        const { userId } = req.params;
        const referralDetails = await referralService.getReferralDetails(
            userId
        );
        res.status(200).json(referralDetails);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getReferralDetails,
};
