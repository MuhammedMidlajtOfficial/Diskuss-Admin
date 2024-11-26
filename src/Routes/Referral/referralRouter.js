const express = require("express");
const router = express.Router();
const ReferralController = require("../../Controller/Referral/referralController");

router.get(
    "/details/:userId",
    ReferralController.getReferralDetailsWithUserMatch
);
router.get("/details", ReferralController.getAllReferralDetails);

router.get("/top-referrer", ReferralController.getTopReferrers);


module.exports = router;
