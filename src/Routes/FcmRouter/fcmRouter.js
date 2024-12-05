const express = require("express");
const { handleSubscription,handleLogin, handleLogout, sendNotification, sendMessageNotification } = require("../../Controller/Fcm/fcmController");

const router = express.Router();

router.post("/subscription", handleSubscription);
router.post("/sendMessageNotification", sendMessageNotification);
router.post("/login", handleLogin);
router.post("/logout", handleLogout);
router.post("/send-notification", sendNotification);

module.exports = router;