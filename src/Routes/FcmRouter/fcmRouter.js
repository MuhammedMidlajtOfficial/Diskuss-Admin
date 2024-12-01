const express = require("express");
const { handleLogin, handleLogout, sendNotification } = require("../../Controller/Fcm/fcmController");

const router = express.Router();

router.post("/login", handleLogin);
router.post("/logout", handleLogout);
router.post("/send-notification", sendNotification);

module.exports = router;