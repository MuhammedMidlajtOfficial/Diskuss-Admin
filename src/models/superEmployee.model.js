const mongoose = require("mongoose");

const superEmployee = new mongoose.Schema({
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
    default: 'SuperEmployee'
  },
});

module.exports = mongoose.model("SuperEmployee", superEmployee);
