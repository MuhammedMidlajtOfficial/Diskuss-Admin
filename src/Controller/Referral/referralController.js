const referralService = require("../../services/Referral/referral.service");

const mongoose = require("mongoose");
const { Referral } = require("../../models/referral.model");
const individualUser = require("../../models/individualUser");

// Function to get referral details by userId
const getReferralDetailsWithUserMatch = async (req, res) => {
    try {
        const { userId } = req.params;
        console.log("userId", userId);

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: "Invalid userId" });
        }

        // Step 1: Find all referrals by the referrer
        const referrals = await Referral.find({ referrer: userId })
            .populate("invitee", "username email phnNumber")
            .populate("referrer", "username email coins")
            .exec();
        console.log("Referrals fetched:", referrals);

        // If no referrals found
        if (!referrals.length) {
            return res
                .status(404)
                .json({ message: "No referrals found for this user" });
        }

        // Step 2: Fetch details of the referrer
        const referrerDetails = await individualUser
            .findById(userId)
            .select("username email coins");
        const response = {
            referrer: {
                id: referrerDetails._id,
                username: referrerDetails.username,
                email: referrerDetails.email,
                coins: referrerDetails.coins,
            },
            referrals: referrals.map((ref) => ({
                referralId: ref._id,
                status: ref.status,
                rewardsEarned: ref.rewardsEarned,
                createdAt: ref.createdAt,
                invitee: ref.invitee, // Populated invitee data from User schema
            })),
        };
        res.status(200).json(response);
    } catch (error) {
        console.error("Error fetching referral details:", error);
        res.status(500).json({ error: error.message });
    }
};

// Function to get all referral details
const getAllReferralDetails = async (req, res) => {
    try {
        // Step 1: Fetch all referrals from the database
        const referrals = await Referral.find()
            .populate("invitee", "username email phnNumber") // Populate invitee details
            .populate("referrer", "username email coins") // Populate referrer details
            .exec();

        // If no referrals found
        if (!referrals.length) {
            return res.status(404).json({ message: "No referrals found" });
        }

        // Step 2: Build the response data
        const response = referrals.map((ref) => ({
            referralId: ref._id,
            status: ref.status,
            rewardsEarned: ref.rewardsEarned,
            createdAt: ref.createdAt,
            referrer: ref.referrer,
            invitee: ref.invitee,
        }));
        res.status(200).json(response);
    } catch (error) {
        console.error("Error fetching all referral details:", error);
        res.status(500).json({ error: error.message });
    }
};
const getTopReferrers = async (req, res) => {
    try {
        // Step 1: Aggregate the referrals to count the number of referrals and calculate total rewards earned
        const topReferrers = await Referral.aggregate([
            {
                $group: {
                    _id: "$referrer", // Group by referrer ID
                    referralCount: { $sum: 1 }, // Count the number of referrals
                    totalRewardsEarned: { $sum: "$rewardsEarned" }, // Calculate total rewards earned
                },
            },
            {
                $sort: { referralCount: -1 }, // Sort by referral count in descending order
            },
            {
                $limit: 3, // Get the top three referrers
            },
        ]);

        // If no referrals found
        if (!topReferrers.length) {
            return res.status(404).json({ message: "No referrers found" });
        }

        // Step 2: Fetch details of the top referrers from the User schema
        const referrerDetails = await individualUser
            .find({ _id: { $in: topReferrers.map((ref) => ref._id) } }) // Match top referrer IDs
            .select("username email coins role");

        // Map referrer details to referral count and rewards earned
        const topReferrerData = topReferrers.map((ref) => {
            const user = referrerDetails.find(
                (user) => user._id?.toString() === ref._id?.toString()
            );
            return {
                id: ref._id,
                username: user?.username || "Unknown User",
                email: user?.email || "Unknown Email",
                coins: user?.coins || 0,
                role: user?.role || "Unknown Role",
                referralCount: ref.referralCount,
                totalRewardsEarned: ref.totalRewardsEarned, // Add total rewards earned to the response
            };
        });

        // Send the response
        res.status(200).json({ topReferrers: topReferrerData });
    } catch (error) {
        console.error("Error fetching top referrers:", error);

        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getReferralDetailsWithUserMatch,
    getAllReferralDetails,
    getTopReferrers,

};
