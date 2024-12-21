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
  image:{
    type: String,
    required: true,
    default:""
  },
  address:{
    type: String,
    required: true,
    default:""
  },
  phnNumber:{
    type: String,
    required: true,
    default:""
  },
  userType:{
    type: String,
    required: true,
    default: 'SuperAdmin'
  },
});

module.exports = mongoose.model("SuperAdmin", superAdmin);
