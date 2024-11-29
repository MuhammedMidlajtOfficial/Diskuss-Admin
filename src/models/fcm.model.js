
const mongoose = require("mongoose");

const fcmSchema = new mongoose.Schema({
  fcmId: {
    type:String,
    required:true
  },
  userId: {
    type:String,
    required:false,
    default:""
  },
  userType: {
    type:String,
    required:false,
    default:""
  },
});

module.exports = mongoose.model("fcmCollection", fcmSchema);