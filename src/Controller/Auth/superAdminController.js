const superAdminModel = require("../../models/superAdmin.model");
const employeeModel = require('../../models/employee.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { deleteImageFromS3, uploadImageToS3 } = require("../../services/AWS/s3Bucket");
const { otpCollection } = require("../../models/otpModule");
const { templates } = require("../../services/Email/email.service");
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
      'assign-tickets',
      'logs',
      'config'
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
    const { email, password, rememberMe } = req.body;

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
    const passwordMatch = await bcrypt.compare(password, user?.password);

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

    const refreshTokenExpiration = rememberMe ? "7d" : "1d"; 

    // Generate access and refresh tokens
    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, );
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, );

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

    // console.log('userExist-', userExist);
    return res.status(200).json({ user: userExist });
  } catch (error) {
    console.error('Error during getSuperAdmin:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports.getUserByCategory = async (req, res) => {
  try {
    const { category } = req.query;
    // Check for missing fields
    if (!category) {
      return res.status(400).json({ message: "category is required in query" });
    }

    // Define a function to search in a model
    const findUserByCategory = async (model) => {
      return await model.find({ category: { $in: [category] } }).select('_id username').exec();
    };

    // Try to find the user in superAdminModel first
    // let userExist = await findUserByCategory(superAdminModel);

    // If not found, try in employeeModel
    // if (!userExist) {
    const userExist = await findUserByCategory(employeeModel);
    // }

    // If user is still not found, return an error response
    if (!userExist || userExist.length === 0) {
      return res.status(200).json({ user: userExist, message: "No user found with the provided category" });
    }

    // Return the found user
    return res.status(200).json({ user: userExist });
  } catch (error) {
    console.error('Error during getUserByCategory:', error);
    return res.status(500).json({ message: "Server error" });
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

    // console.log('userExist-',userExist);

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

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Both Old Password and New Password are required"});
    }

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

    const passwordMatched = await bcrypt.compare(oldPassword, userExist.password);

    if (!passwordMatched) {
      return res.status(401).json({ message: "Incorrect password. Please try again"});
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    userExist.password = hashedPassword;
    await userExist.save();

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error('Error during getSuperAdmin:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports.forgotPasswordRequestOtp = async (req, res) => {
  try {
    
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    let user = await superAdminModel.findOne({ email });

    if (!user) {
      user = await employeeModel.findOne({ email }).exec();
    }

    if (!user) {
      return res.status(404).json({ message: "No user found with the provided Email" });
    }

    await otpCollection.deleteMany({ email });

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    console.log("generated otp is ",otp);

    // Save OTP to record
    const newOTP = new  otpCollection({ email, otp });
    await newOTP.save()

    return res.status(200).json({message: "OTP sent successfully to your email"});
  } catch (error) {
    console.error("Error in requestOTP controller:", error);
    return res.status(500).json({
      message: "Failed to send OTP. Please try again",
      error: error.message,
    });
  }
};

module.exports.forgotPasswordValidateOtp = async (req, res) => {
  try {
    const { email,otp } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!otp) {
      return res.status(400).json({ message: "OTP is required" });
    }

    let user = await superAdminModel.findOne({ email });

    if (!user) {
      user = await employeeModel.findOne({ email }).exec();
    }

    if (!user) {
      return res.status(404).json({ message: "No user found with the provided Email" });
    }

    const validOTP = await otpCollection.findOne({ email, otp });

    if (!validOTP) {
      return res.status(400).json({ message: "Invalid OTP or OTP expired." });
    }

    const payload = {
      email:email,
      type: "reset-password"
    }

    const token = jwt.sign(payload,process.env.ACCESS_TOKEN_SECRET,{expiresIn:"10m"})

    return res.status(200).json({ message: "OTP verified successfully",token });
  } catch (error) {
    console.error("Error in OTP verification:", error);
    return res.status(500).json({ message: "An error occurred while verifying OTP. Please try again later." });
  }
};

module.exports.forgotPasswordReset = async (req, res) => {
  try {
    const { token,newPassword } = req.body;

    if(!token){
      return res.status(400).json({ message: "Unable to validate the User,Please Try again!" });
    }

    if (!newPassword) {
      return res.status(400).json({ message: "Password is required" });
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (error) {
      console.error("not verified ",error)
      return res.status(400).json({message:"The time to reset your password has expired. Please request a new OTP to continue"});
    }

    if (decodedToken.type !== "reset-password") {
      return res.status(400).json({ message: "Invalid token type" });
    }

    let user = await superAdminModel.findOne({ email:decodedToken.email });

    if (!user) {
      user = await employeeModel.findOne({ email:decodedToken.email}).exec();
    }

    if (!user) {
      return res.status(404).json({ message: "No user found with the provided Email" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    await otpCollection.deleteOne({ email: decodedToken.email });

    return res.status(200).json({ message: "Password Reset successfully." });
  } catch (error) {
    console.error("Error in OTP verification:", error);
    return res.status(500).json({ message: "An error occurred while verifying OTP. Please try again later." });
  }
};
