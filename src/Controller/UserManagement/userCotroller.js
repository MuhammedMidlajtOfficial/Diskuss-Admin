const {uploadImageToS3, deleteImageFromS3}= require("../../services/AWS/s3Bucket");
const enterpriseEmployeModel = require("../../models/enterpriseEmploye.model");
const enterpriseUser = require("../../models/enterpriseUser");
const individualUser= require("../../models/individualUser");
const userSubscriptionModel = require("../../models/userSubscription.model");
const bcrypt = require('bcrypt');
const moment = require("moment");
const { default: mongoose } = require("mongoose");
const enterpriseEmployeCardModel = require("../../models/enterpriseEmployeCard.model");
const sendVerificationEmail = require("../../models/otpModule");

module.exports.getAllUsers = async (req, res) => {
  try {
    const { filter } = req.params; // Filter from route parameters
    const { page = 1, pageSize, sortField = 'username', sortOrder = 'asc', search = '' } = req.query; // Get search term
    const skip = (parseInt(page, 10) - 1) * parseInt(pageSize, 10);
    const limitValue = parseInt(pageSize, 10);
    const sort = { [sortField]: sortOrder === 'asc' ? 1 : -1 };

    let totalUser = [];
    let totalCount = 0;

    const fetchUsersWithSubscription = async (model, searchQuery) => {
      const searchRegex = new RegExp(searchQuery, 'i'); // Create a case-insensitive search regex
      const users = await model
        .find({
          isDeleted: false,
          $or: [
            { username: { $regex: searchRegex } },
            { email: { $regex: searchRegex } },
            { name: { $regex: searchRegex } },
            // Add other fields as necessary for the search
          ],
        })
        .sort(sort)
        .skip(skip)
        .limit(limitValue)
        .lean(); // Use lean for better performance

      // Add subscription details to each user
      for (const user of users) {
        let subscription = await userSubscriptionModel.findOne({ userId: user._id, status:'active' })
          .populate('planId') // Populate plan details
          .lean();
        if(!subscription){
          subscription = await userSubscriptionModel.findOne({ userId: user._id })
          .populate('planId') // Populate plan details
          .lean();
        }
        
        // console.log('user--', user);
        // console.log('subscription--', subscription);
        if(subscription === null){
          // DO nothing 
        }else if (subscription.status === 'free') {
          user.subscriptionPlan = "Free Plan"
        }else{
          user.subscriptionPlan = subscription ? subscription?.planId?.name : null;
        }
      }
      return users;
    };

    if (filter === 'individualUser') {
      totalCount = await individualUser.countDocuments({
        isDeleted: false,
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } },
        ],
      });
      totalUser = await fetchUsersWithSubscription(individualUser, search);
    } else if (filter === 'enterpriseUser') {
      totalCount = await enterpriseUser.countDocuments({
        isDeleted: false,
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } },
        ],
      });
      totalUser = await fetchUsersWithSubscription(enterpriseUser, search);
    } else if (filter === 'enterpriseEmploye') {
      totalCount = await enterpriseEmployeModel.countDocuments({
        isDeleted: false,
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } },
        ],
      });
      totalUser = await fetchUsersWithSubscription(enterpriseEmployeModel, search);
    } else {
      const IndividualUsers = await fetchUsersWithSubscription(individualUser, search);
      const EnterpriseUsers = await fetchUsersWithSubscription(enterpriseUser, search);
      const EnterpriseEmployees = await fetchUsersWithSubscription(enterpriseEmployeModel, search);

      totalUser = [...IndividualUsers, ...EnterpriseUsers, ...EnterpriseEmployees];
      totalCount = totalUser.length;
    }

    return res.status(200).json({
      totalUser,
      totalCount,
      currentPage: parseInt(page, 10),
      totalPages: Math.ceil(totalCount / limitValue),
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports.addIndividualUser = async (req,res) =>{
  try {
    const {
      username,
      email,
      image,
      companyName,
      role,
      name,
      website,
      phnNumber,
      address,
      whatsappNo,
      facebookLink,
      instagramLink,
      twitterLink,
    } = req.body
    const passwordRaw = req.body.password;

    // Check for missing fields
    if (!username || !email || !passwordRaw ) {
      return res.status(400).json({ message :"username,email and password are required"}); // Correct response handling
    }

    // Check if email or phone number exists in any model
    const existingUser = await Promise.all([
      individualUser.findOne({ $or: [{ email }, { phnNumber }] }).exec(),
      enterpriseUser.findOne({ $or: [{ email }, { phnNumber }] }).exec(),
      enterpriseEmployeModel.findOne({ $or: [{ email }, { phnNumber }] }).exec()
    ]);

    if (existingUser.some(user => user)) {
     return res.status(409).json({ message :"A user with this email  address or Phone number already exists. Please login instead"}); // Correct response handling
    }


    let imageUrl ;

    // Upload image to S3 if a new image is provided
    if (image) {
      const imageBuffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ""), 'base64');
      const fileName = `-profile.jpg`; // Unique file name based on user ID and card ID
      try {
        const uploadResult = await uploadImageToS3(imageBuffer, fileName);
        imageUrl = uploadResult.Location; // URL of the uploaded image
      } catch (uploadError) {
        console.log("Error uploading image to S3:", uploadError);
        return res.status(500).json({ message: "Failed to upload image", error: uploadError });
      }
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(passwordRaw, 10);
    // Create a new user
    const newUser = await individualUser.create({
      username,
      email,
      password: hashedPassword,
      image: imageUrl,
      role,
      companyName,
      name,
      website,
      phnNumber,
      address,
      socialMedia: {
        whatsappNo,
        facebookLink,
        instagramLink,
        twitterLink,
      },
    });

    console.log(newUser);
    return res.status(201).json({ message: "User created", user: newUser });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports.addEnterpriseUser = async (req, res) => {
  try {
    const {
      username,
      companyName,
      industryType,
      email,
      image,
      phnNumber,
      address,
      website,
      aboutUs,
      whatsappNo,
      facebookLink,
      instagramLink,
      twitterLink,
    } = req.body;
    const passwordRaw = req.body.password;

    // Check for missing fields
    if (!companyName || !industryType || !email || !passwordRaw || !username) {
      return res.status(400).json({ message: "Company name, industry type, email, and password are required" });
    }

  const existingUser = await Promise.all([
      individualUser.findOne({ $or: [{ email }, { phnNumber }] }).exec(),
      enterpriseUser.findOne({ $or: [{ email }, { phnNumber }] }).exec(),
      enterpriseEmployeModel.findOne({ $or: [{ email }, { phnNumber }] }).exec()
    ]);

    if (existingUser.some(user => user)) {
     return res.status(409).json({ message :"A user with this email  address or Phone number already exists. Please login instead"}); // Correct response handling
    }
    
    let imageUrl;

    // Upload image to S3 if a new image is provided
    if (image) {
      const imageBuffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ""), 'base64');
      const fileName = `-profile.jpg`; // Unique file name based on company name
      try {
        const uploadResult = await uploadImageToS3(imageBuffer, fileName);
        imageUrl = uploadResult.Location; // URL of the uploaded image
      } catch (uploadError) {
        console.log("Error uploading image to S3:", uploadError);
        return res.status(500).json({ message: "Failed to upload image", error: uploadError });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(passwordRaw, 10);

    // Create a new enterprise user
    const newEnterpriseUser = await enterpriseUser.create({
      username,
      companyName,
      industryType,
      email,
      password: hashedPassword,
      image: imageUrl,
      phnNumber,
      address,
      website,
      aboutUs,
      socialMedia: {
        whatsappNo,
        facebookLink,
        instagramLink,
        twitterLink,
      },
    });

    console.log(newEnterpriseUser);
    return res.status(201).json({ message: "Enterprise user created", user: newEnterpriseUser });
  } catch (error) {
    console.error('Error creating enterprise user:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports.addEnterpriseEmployee = async (req, res) => {
  try {
    const {
      userId, // enterprise ID
      businessName,
      yourName,
      businessType,
      designation,
      mobile,
      email,
      location,
      services,
      image,
      position,
      color,
      website,
      theme,
      topServices,
      whatsappNo,
      facebookLink,
      instagramLink,
      twitterLink,
    } = req.body;

    console.log('req.body-',req.body);
    
    
    const passwordRaw = "123"; // Default password for new employees

    // Validate required fields
    if (!email || !mobile || !userId || !businessName || !yourName) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // Check if enterprise exists
    const isEnterpriseIDExist = await enterpriseUser.findOne({ _id: userId }).exec();
    
    if (!isEnterpriseIDExist) {
      console.log('Enterprise user not found');
      return res.status(409).json({ message: "Enterprise user not found" });
    }

    // Check for existing email
    const isEmailExist = await enterpriseEmployeModel.findOne({ email }).exec();
    const isEmailExistInEnterpriseUser = await enterpriseUser.findOne({ email }).exec();

    console.log('isEmailExist-',isEmailExist);
    console.log('isEmailExistInEnterpriseUser-',isEmailExistInEnterpriseUser);
    
    if (isEmailExist || isEmailExistInEnterpriseUser) {
      console.log('A user with this email address already exists. Please use another email');
      return res.status(409).json({
        message: "A user with this email address already exists. Please use another email",
      });
    }

    // Check for existing phone number
    const isPhoneExist = await Promise.all([
      individualUser.findOne({ phnNumber: mobile }).exec(),
      enterpriseUser.findOne({ phnNumber: mobile }).exec(),
      enterpriseEmployeModel.findOne({ phnNumber: mobile }).exec()
    ]);

    if (isPhoneExist.some(result => result)) {
      console.log('This phone number is already associated with another user');
      return res.status(409).json({ 
        message: "This phone number is already associated with another user" 
      });
    }

    // Process image if provided
    let imageUrl = image;
    if (image) {
      const imageBuffer = Buffer.from(
        image.replace(/^data:image\/\w+;base64,/, ""),
        "base64"
      );
      const fileName = `${userId}-${Date.now()}-employeeCard.jpg`;
      try {
        const uploadResult = await uploadImageToS3(imageBuffer, fileName);
        imageUrl = uploadResult.Location;
      } catch (uploadError) {
        console.log("Error uploading image to S3:", uploadError);
        return res.status(500).json({ 
          message: "Failed to upload image", 
          error: uploadError 
        });
      }
    }

    // Create employee
    const hashedPassword = await bcrypt.hash(passwordRaw, 10);
    const newUser = await enterpriseEmployeModel.create({
      username: yourName,
      email,
      companyName: businessName,
      phnNumber: mobile,
      password: hashedPassword,
      role:designation,
      cardNo: 0,
      theme
    });

    if (!newUser) {
      return res.status(404).json({ message: "User creation failed" });
    }

    // Create employee card
    const newCard = new enterpriseEmployeCardModel({
      userId: newUser._id,
      businessName,
      businessType,
      email,
      yourName,
      designation,
      mobile,
      location,
      services,
      image: imageUrl,
      position,
      color,
      website,
      enterpriseId: userId,
      theme,
      topServices,
      whatsappNo,
      facebookLink,
      instagramLink,
      twitterLink,
    });

    const result = await newCard.save();
    if (!result) {
      // Cleanup: remove created user if card creation fails
      await enterpriseEmployeModel.deleteOne({ _id: newUser._id });
      return res.status(500).json({ 
        message: "Failed to save enterprise employee card" 
      });
    }

    // Update enterprise user with new employee and card
    await enterpriseUser.updateOne(
      { _id: userId },
      {
        $push: {
          empCards: {
            empCardId: result._id,
            status: 'active',
          },
          empIds: {
            empId: newUser._id,
            status: 'active',
          },
        },
      }
    );

    // Update employee card count
    await enterpriseEmployeModel.updateOne(
      { _id: newUser._id },
      { $inc: { cardNo: 1 } }
    );

    // Send welcome email
    // await sendVerificationEmail(email, newUser.email, passwordRaw);

    return res.status(201).json({
      message: "Enterprise employee and card added successfully",
      entryId: result._id,
      employeeId: newUser._id
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      message: "Failed to add employee and card", 
      error: error.message 
    });
  }
};

module.exports.changeUserStatus = async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if the user exists in the EnterpriseUser collection
    const enterpriseUserExist = await enterpriseUser.findById(userId);
    const enterpriseEmployeeExist = await enterpriseEmployeModel.findById(userId);
    const individualUserExist = await individualUser.findById(userId);

    if (enterpriseUserExist) {
      // Toggle status for enterpriseUser
      if (enterpriseUserExist.status === "active") {
        await enterpriseUser.updateOne({ _id: userId }, { status: "inactive" });
      } else if (enterpriseUserExist.status === "inactive") {
        await enterpriseUser.updateOne({ _id: userId }, { status: "active" });
      }
      console.log('Enterprise user status updated');
      return res.status(200).json({ message: `Enterprise user status updated` });
    } else if (enterpriseEmployeeExist) {
      // Toggle status for enterpriseEmployee
      if (enterpriseEmployeeExist.status === "active") {
        await enterpriseEmployeModel.updateOne({ _id: userId }, { status: "inactive" });
        await enterpriseEmployeCardModel.updateOne({ userId }, { status: "inactive" });
      } else if (enterpriseEmployeeExist.status === "inactive") {
        await enterpriseEmployeModel.updateOne({ _id: userId }, { status: "active" });
        await enterpriseEmployeCardModel.updateOne({ userId }, { status: "active" });
      }
      console.log('Enterprise employee status updated');
      return res.status(200).json({ message: `Enterprise employee status updated` });
    } else if (individualUserExist) {
      // Toggle status for individualUser
      if (individualUserExist.status === "active") {
        await individualUser.updateOne({ _id: userId }, { status: "inactive" });
      } else if (individualUserExist.status === "inactive") {
        await individualUser.updateOne({ _id: userId }, { status: "active" });
      }
      console.log('Individual user status updated');
      return res.status(200).json({ message: `Individual user status updated` });
    } else {
      return res.status(404).json({ message: 'User not found' });
    }

  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if the user exists in the EnterpriseUser collection
    const enterpriseUserExist = await enterpriseUser.findById(userId);
    if (enterpriseUserExist) {
      return res.status(200).json({ userData: enterpriseUserExist, userType: 'enterprise' });
    }

    // Check if the user exists in the EnterpriseEmployee collection
    const enterpriseEmployeeExist = await enterpriseEmployeModel.findById(userId);
    if (enterpriseEmployeeExist) {
      return res.status(200).json({ userData: enterpriseEmployeeExist, userType: 'enterpriseEmp' });
    }

    // Check if the user exists in the IndividualUser collection
    const individualUserExist = await individualUser.findById(userId);
    if (individualUserExist) {
      const subscription = await userSubscriptionModel.findOne({ userId: individualUserExist._id }).select("planId").populate("planId").exec()
      return res.status(200).json({ userData: individualUserExist, userType: 'individual', subscription });
    }

    // If no user is found in any collection
    return res.status(404).json({ message: 'User not found' });

  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports.updateProfile = async (req, res) => {
  try {
    const { userType, ...requestData } = req.body;
    const { id: userId } = req.params;
    // Validate required fields
    if (!userType || !userId) {
      return res.status(400).json({ message: "userType and userId are required" });
    }

    // Define allowed fields for each user type
    const allowedFields = {
      individual: ['username', 'email', 'image', 'role', 'name', 'website', 'companyName', 'phnNumber', 'address', 'socialMedia'],
      enterprise: ['username', 'email', 'image', 'website', 'phnNumber', 'address', 'socialMedia', 'companyName', 'industryType', 'aboutUs'],
      enterpriseEmp: ['username', 'email', 'image', 'role', 'website', 'phnNumber', 'address', 'socialMedia']
    };

    // Filter `requestData` to only include allowed fields for the specific `userType`
    const updateData = Object.fromEntries(
      Object.entries(requestData).filter(([key]) => allowedFields[userType]?.includes(key))
    );

    // Handle social media updates
    const socialMediaFields = ['whatsappNo', 'facebookLink', 'instagramLink', 'twitterLink'];
    const socialMediaUpdate = Object.fromEntries(
      socialMediaFields
        .filter(field => requestData[field])
        .map(field => [field, requestData[field]])
    );

    if (Object.keys(socialMediaUpdate).length > 0) {
      updateData.socialMedia = socialMediaUpdate;
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    // Set model and user type name based on `userType`
    let model, userTypeName;
    switch (userType) {
      case 'individual':
        model = individualUser;
        userTypeName = "Individual user";
        break;
      case 'enterprise':
        model = enterpriseUser;
        userTypeName = "Enterprise user";
        break;
      case 'enterpriseEmp':
        model = enterpriseEmployeModel;
        userTypeName = "Enterprise employee";
        break;
      default:
        return res.status(400).json({ message: "Invalid userType provided" });
    }

    // Check if the user exists
    const userExist = await model.findById(userId);
    if (!userExist) {
      return res.status(404).json({ message: `${userTypeName} not found` });
    }

    // Handle image upload if provided
    if (requestData.image && requestData.image.length) {
      if (userExist.image) {
        await deleteImageFromS3(userExist.image); // Delete the old image from S3
      }

      const imageBuffer = Buffer.from(requestData.image.replace(/^data:image\/\w+;base64,/, ""), 'base64');
      const fileName = `${userId}-${Date.now()}-profile.jpg`;

      try {
        const uploadResult = await uploadImageToS3(imageBuffer, fileName);
        if (uploadResult && uploadResult.Location) {
          updateData.image = uploadResult.Location;
        }
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }

    // Update the user data with the filtered and updated fields
    const updateResult = await model.updateOne({ _id: userId }, { $set: updateData });
    return res.status(200).json({
      message: updateResult.modifiedCount > 0
        ? `${userTypeName} updated successfully`
        : "No changes made"
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ message: 'An error occurred while updating the user' });
  }
};


module.exports.getEnterpriseUserCount = async (req, res) => {
  try {
    // Get the start and end of the current month
    const startOfMonth = moment().startOf('month').toDate();
    const endOfMonth = moment().endOf('month').toDate();

    // Count all enterprise users
    const EnterpriseUserCount = await enterpriseUser.countDocuments();

    // Find unique subscribed user IDs with 'active' status
    const uniqueSubscribedUsers = await userSubscriptionModel.distinct('userId', { status: 'active' });

    // Count users who are both enterprise users and active subscribers
    const activeEnterpriseUsersCount = await enterpriseUser.countDocuments({
      _id: { $in: uniqueSubscribedUsers }
    });

    // Count enterprise users created this month
    const thisMonthEnterpriseUsersCount = await enterpriseUser.countDocuments({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    return res.status(200).json({
      EnterpriseUserCount,
      activeEnterpriseUsersCount,
      thisMonthEnterpriseUsersCount
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports.getEnterpriseUser = async (req, res) => {
  try {
    // Destructure query parameters with defaults
    const {
      page = 1,
      pageSize: pageSizeQuery,
      sortField = 'companyName', // Default to sorting by companyName
      sortOrder = 'asc',         // Default to ascending order
      search = '',
    } = req.query;

    // Ensure sortField is a valid field in your collection
    const validSortFields = ['username', 'email', 'companyName']; // Add companyName as valid
    if (!validSortFields.includes(sortField)) {
      return res.status(400).json({ message: 'Invalid sort field' });
    }

    // Parse pageSize and page as integers with default values
    const pageSize = parseInt(pageSizeQuery, 10) || 12; // Default pageSize is 12
    const skip = (parseInt(page, 10) - 1) * pageSize; // Calculate skip for pagination
    const sort = { [sortField]: sortOrder === 'asc' ? 1 : -1 }; // Sort order based on the query

    const searchRegex = new RegExp(search, 'i'); // Case-insensitive regex for search

    // Fetch matching enterprise users with pagination and sorting
    const enterpriseUsers = await enterpriseUser
      .find({
        $or: [
          { companyName: { $regex: searchRegex } },
          { username: { $regex: searchRegex } },
          { email: { $regex: searchRegex } },
          { name: { $regex: searchRegex } },
          // Add more searchable fields here if needed
        ],
      })
      .sort(sort)
      .skip(skip)
      .limit(pageSize)
      .lean() // Use lean for better performance
      .populate({
        path: 'empIds.empId', // Populate the empId references
        select: '_id', // Only select the _id of employees
      })
      .select('companyName email image phnNumber');

    // Add employee counts to each user
    const usersWithEmployeeCounts = enterpriseUsers.map((user) => ({
      ...user,
      employeeCount: user.empIds ? user.empIds.length : 0,
    }));

    // Count total matching documents
    const totalCount = await enterpriseUser.countDocuments({
      $or: [
        { username: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
        { name: { $regex: searchRegex } },
      ],
    });

    // Return users and total count in the response
    return res.status(200).json({ users: usersWithEmployeeCounts, totalCount });
  } catch (error) {
    console.error('Error fetching enterprise users:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports.getEnterpriseUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if the user exists in the EnterpriseUser collection
    const enterpriseUserExist = await enterpriseUser.findById(userId).populate('empIds.empId')
    if (enterpriseUserExist) {
      return res.status(200).json({ userData: enterpriseUserExist, userType: 'enterprise' });
    }

    // If no user is found in any collection
    return res.status(404).json({ message: 'User not found' });

  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
