const superAdminModel = require("../../models/superAdmin.model");
const employeeModel = require('../../models/employee.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { deleteImageFromS3, uploadImageToS3 } = require("../../services/AWS/s3Bucket");
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
      user,
      ...(userType === 'employee' && { category: user.category }), // Include category in the response if Employee
    });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports.getSuperAdmin = async (req, res) => {
  try {
    const { id: userId } = req.params;

    // Check for missing fields
    if ( !userId ) {
      return res.status(400).json({ message: "userId is required in params" });
    }

    // Check if email exists
    const userExist = await superAdminModel.findOne({ _id : userId }).exec();
    // console.log('userId-',userId);
    // console.log('userExist-',userExist);
    if (!userExist) {
      return res.status(409).json({ message: "A super admin with this userId not exists" });
    }

    return res.status(200).json({ user: userExist });
  } catch (error) {
    console.error('Error during signup:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports.updateSuperAdmin = async (req, res) => {
  try {
    const { username, image, address, phnNumber } = req.body;
    const userId = req.params.id;
    console.log("userId-",userId);
    if( !userId ){
      return res.status(404).json({ message: "User ID found" });
    }

    // Check if email exists
    const isUserExist = await superAdminModel.findOne({ _id:userId }).exec();
    if (!isUserExist) {
      return res.status(404).json({ message: "User not found" });
    }

    let imageUrl = isUserExist.image;

    // Upload image to S3 if a new image is provided
    if (image) {
      // Delete the old image from S3 (if exists)
      if (isUserExist?.image) {
        await deleteImageFromS3(isUserExist.image); // Delete the old image from S3
      }
      const imageBuffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ""), 'base64');
      const fileName = `${userId}-profile.jpg`; // Unique file name based on user ID and card ID
      try {
        const uploadResult = await uploadImageToS3(imageBuffer, fileName);
        imageUrl = uploadResult.Location; // URL of the uploaded image
      } catch (uploadError) {
        console.log("Error uploading image to S3:", uploadError);
        return res.status(500).json({ message: "Failed to upload image", error: uploadError });
      }
    }

    // Update a new Super Admin
    const updateSuperAdmin = await superAdminModel.updateOne(
    { _id:userId },
    {
      username,
      image: imageUrl,
      address,
      phnNumber,
    });

    if (updateSuperAdmin.modifiedCount > 0) {
      return res.status(200).json({ message: "Super Admin updated successfully" });
    } else if (updateSuperAdmin.matchedCount > 0) {
      // Record exists but no changes were made
      return res.status(304).json({ message: "No changes made to Super Admin details" });
    } else {
      // No matching record was found
      return res.status(404).json({ message: "Super Admin not found" });
    }
  } catch (error) {
    console.error('Error during signup:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};