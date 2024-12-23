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

    const category = [
      'dashboard-overview',
      'view-user-profile',
      'manage-enterprise-user',
      'manage-subscription-plans',
      'card-share-interaction',
      'user-activity-reports',
      'view-payment-history',
      'generate-invoice',
      'view-respond-tickets',
      'send-notification',
      'create-employee',
      'ticket-categories',
      'assign-tickets'
    ]

    // Create a new Super Admin
    const newSuperAdmin = await superAdminModel.create({
      username,
      email,
      password: hashedPassword,
      category
    });

    return res.status(201).json({
      message: "Super admin created",
      superAdmin: newSuperAdmin,

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
      username:user.username,
      category: user.category,
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
      username:user.username,
      user,
      category: user.category
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
    if (!userId) {
      return res.status(400).json({ message: "userId is required in params" });
    }

    // Find user in superAdminModel
    let userExist = await superAdminModel.findOne({ _id: userId }).exec();

    // If not found, check in employeeModel
    if (!userExist) {
      userExist = await employeeModel.findOne({ _id: userId }).exec();
    }

    // If user still not found, return an error response
    if (!userExist) {
      return res.status(404).json({ message: "No user found with the provided userId" });
    }

    console.log('userExist-', userExist);
    return res.status(200).json({ user: userExist });
  } catch (error) {
    console.error('Error during getSuperAdmin:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports.updateUser = async (req, res) => {
  try {
    const { username, image, address, phnNumber, userType } = req.body;
    const userId = req.params.id;
    console.log("userType-", userType);

    if (!userId) {
      return res.status(404).json({ message: "User ID not found" });
    }

    // Check if the user exists in the appropriate model based on userType
    let userExist;

    if (userType === 'SuperAdmin') {
      userExist = await superAdminModel.findOne({ _id: userId }).exec();
    } else if (userType === 'Employee') {
      userExist = await employeeModel.findOne({ _id: userId }).exec();
    }

    console.log('userExist-',userExist);

    if (!userExist) {
      return res.status(404).json({ message: `${userType} not found` });
    }

    let imageUrl = userExist?.image;
    
    // Upload image to S3 if a new image is provided
    if (image) {
      // Delete the old image from S3 (if exists)
      if (userExist?.image) {
        await deleteImageFromS3(userExist.image); // Delete the old image from S3
      }
      const imageBuffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ""), 'base64');
      const fileName = `${userId}-${Date.now()}-profile.jpg`; // Unique file name based on user ID
      try {
        const uploadResult = await uploadImageToS3(imageBuffer, fileName);
        imageUrl = uploadResult.Location; // URL of the uploaded image
      } catch (uploadError) {
        console.log("Error uploading image to S3:", uploadError);
        return res.status(500).json({ message: "Failed to upload image", error: uploadError });
      }
    }

    // Update the user based on the userType
    let updateResult;
    if (userType === 'SuperAdmin') {
      updateResult = await superAdminModel.updateOne(
        { _id: userId },
        {
          username,
          image: imageUrl,
          address,
          phnNumber,
        }
      );
    } else if (userType === 'Employee') {
      updateResult = await employeeModel.updateOne(
        { _id: userId },
        {
          username,
          image: imageUrl,
          address,
          phnNumber,
        }
      );
    }

    if (updateResult.modifiedCount > 0) {
      return res.status(200).json({ message: `${userType} updated successfully` });
    } else {
      // No matching record was found
      return res.status(200).json({ message: `No changes made to ${userType} details` });
    }
  } catch (error) {
    console.error('Error during update:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports.updateUserPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword} = req.body
    const { id: userId } = req.params;

    // Check for missing fields
    if (!userId) {
      return res.status(400).json({ message: "userId is required in params" });
    }

    // Find user in superAdminModel
    let userExist = await superAdminModel.findOne({ _id: userId }).exec();

    // If not found, check in employeeModel
    if (!userExist) {
      userExist = await employeeModel.findOne({ _id: userId }).exec();
    }

    // If user still not found, return an error response
    if (!userExist) {
      return res.status(404).json({ message: "No user found with the provided userId" });
    }

    // if( userExist.userType === 'SuperAdmin' ){
    //   const passwordMatch = 
    // }

    console.log('userExist-', userExist);
    return res.status(200).json({ user: userExist });
  } catch (error) {
    console.error('Error during getSuperAdmin:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
