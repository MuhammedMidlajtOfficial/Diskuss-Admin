const mongoose = require('mongoose');

const enterpriseMessageSchema = new mongoose.Schema({
  chatId: { type: String, required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  receiverId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false },
});

// Custom transformation
enterpriseMessageSchema.set('toJSON', {
  transform: function (doc, ret) {
    // Convert the timestamp to a string
    ret.timestamp = ret.timestamp.toISOString(); // ISO 8601 string format
    return ret;
  },
});


module.exports = mongoose.model('EnterpriseMessage', enterpriseMessageSchema);