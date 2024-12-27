const mongoose = require("mongoose");

const watiSchema = new mongoose.Schema(
  {
    url: { 
        type: String, 
        required: true 
    },
    apiKey: { 
        type: String, 
        required: true },
  },
  { Timestamp: true }
);

module.exports = mongoose.model("wati", watiSchema);
