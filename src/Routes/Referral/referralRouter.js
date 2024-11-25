const { express } = require("express");
const router = express.Router();
const ReferralController = require("../../Controller/Referral/referralController");

router.get("details/:userId", ReferralController.getReferralDetails);

module.exports = router;
