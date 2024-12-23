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
    default:""
  },
  address:{
    type: String,
    default:""
  },
  phnNumber:{
    type: String,
    default:""
  },
  userType:{
    type: String,
    required: true,
    default: 'SuperAdmin'
  },
  category:{
    type: Array,
    required: true,
    default: []
  },
});

module.exports = mongoose.model("SuperAdmin", superAdmin);
