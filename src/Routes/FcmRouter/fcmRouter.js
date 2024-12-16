const express = require("express");
const { handleSubscription,handleLogin, handleLogout, sendNotification, sendMessageNotification, sendMeetingNotification, sendMeetingAcceptanceNotification } = require("../../Controller/Fcm/fcmController");

const router = express.Router();

router.post("/subscription", handleSubscription);
router.post("/acceptanceNotification", sendMeetingAcceptanceNotification);
router.post("/sendMessageNotification", sendMessageNotification);
router.post("/sendMeetingNotification", sendMeetingNotification);
router.post("/login", handleLogin);
router.post("/logout", handleLogout);
router.get("/send-notification", sendNotification);

module.exports = router;
