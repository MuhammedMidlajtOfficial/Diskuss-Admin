const mongoose = require("mongoose");

const superAdmin = new mongoose.Schema({
  username:{
    type: String,
    required: true
  },
  email:{
    type: String,
    required: true
  },
  password:{
    type: String,
    required: true
  },
  userType:{
    type: String,
    required: true,
    default: 'SuperAdmin'
  },
});

module.exports = mongoose.model("SuperAdmin", superAdmin);
