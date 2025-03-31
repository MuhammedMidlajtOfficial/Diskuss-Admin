const express = require("express");
const { handleSubscription,handleSubscriptionExpiry,handleLogin, handleLogout, sendNotification, sendMessageNotification,sendAdminNotification, sendMeetingNotification, sendMeetingAcceptanceNotification, sendContactNotification } = require("../../Controller/Fcm/fcmController");

const router = express.Router();

router.post("/subscription", handleSubscription);
router.post("/subscriptionExpiry", handleSubscriptionExpiry);
router.post("/acceptanceNotification", sendMeetingAcceptanceNotification);
router.post("/sendMessageNotification", sendMessageNotification);
router.post("/sendAdminNotification", sendAdminNotification);
router.post("/sendMeetingNotification", sendMeetingNotification);
router.post("/sendContactNotification", sendContactNotification);
router.post("/login", handleLogin);
router.post("/logout", handleLogout);
router.post("/send-notification", sendNotification);

module.exports = router;
