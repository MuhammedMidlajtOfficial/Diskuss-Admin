const superAdminModel = require("../../models/superAdmin.model");
const employeeModel = require('../../models/employee.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();


module.exports.postSuperAdminSignup = async (req, res) => {
  try {
    const { username, email } = req.body;
    const passwordRaw = req.body.password;

    // Check for missing fields
    if (!username || !email || !passwordRaw) {
      return res.status(400).json({ message: "username, email, and password are required" });
    }

    // Check if email exists
    const isEmailExist = await superAdminModel.findOne({ email }).exec();
    if (isEmailExist) {
      return res.status(409).json({ message: "A super admin with this email address already exists. Please login instead" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(passwordRaw, 10);

    // Create a new Super Admin
    const newSuperAdmin = await superAdminModel.create({
      username,
      email,
      password: hashedPassword,
    });

    return res.status(201).json({
      message: "Super admin created",
      superAdmin: newSuperAdmin
    });
  } catch (error) {
    console.error('Error during signup:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};


module.exports.postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate request body
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    let user = null; // To store the logged-in user
    let userType = null; // To differentiate between superAdmin and Employee

    // First, check if the user is a superAdmin
    user = await superAdminModel.findOne({ email });
    if (user) {
      userType = 'superAdmin';
    } else {
      // If not a superAdmin, check in the Employee collection
      user = await employeeModel.findOne({ email });
      if (user) {
        userType = 'employee';
      }
    }

    // If no user is found
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address' });
    }

    // Check if the password matches
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Incorrect password. Please try again' });
    }

    // Prepare the payload for the JWT
    const payload = {
      id: user._id,
      email: user.email,
      userType: userType, // Indicate whether superAdmin or Employee
      userName:user.userName,
      ...(userType === 'employee' ? { category: user.category } : {}), // Include category if Employee
    };

    // Generate access and refresh tokens
    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

    // Respond with the appropriate details
    return res.status(200).json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      userType,
      userName:user.userName,
      ...(userType === 'employee' && { category: user.category }), // Include category in the response if Employee
    });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
