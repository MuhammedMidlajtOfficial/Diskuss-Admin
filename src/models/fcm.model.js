const mongoose = require("mongoose");

const fcmSchema = new mongoose.Schema({
  fcmId: { type: String, required: true },
  userId: { type: String, default: null },
  userType: { type: String, default: null },
  topic: { type: String, default: "unregistered" },
});

module.exports = mongoose.model("fcmCollection", fcmSchema);
