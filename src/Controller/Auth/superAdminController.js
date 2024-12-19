const superAdminModel = require("../../models/superAdmin.model");
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

module.exports.postSuperAdminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const superAdmin = await superAdminModel.findOne({ email });
    if (!superAdmin) {
      return res.status(404).json({ message: 'No account found with this email address' });
    }

    // Check password match
    const passwordMatch = await bcrypt.compare(password, superAdmin.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Incorrect password. Please try again' });
    }

    // Set JWT tokens
    const payload = { 
      id: superAdmin._id, 
      email: superAdmin.email,
      userType: superAdmin.userType  // Add the userType here
    };
    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

    return res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken,
      superAdmin
    });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
