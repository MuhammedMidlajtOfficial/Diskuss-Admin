const {uploadImageToS3, deleteImageFromS3}= require("../../services/AWS/s3Bucket");
const enterpriseEmployeModel = require("../../models/enterpriseEmploye.model");
const enterpriseUser = require("../../models/enterpriseUser");
const individualUser= require("../../models/individualUser");
const userSubscriptionModel = require("../../models/userSubscription.model");
const bcrypt = require('bcrypt');
const moment = require("moment");

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
        const subscription = await userSubscriptionModel.findOne({ userId: user._id })
          .populate('planId') // Populate plan details
          .lean();
        // console.log('subscription--', subscription);
        user.subscriptionPlan = subscription ? subscription?.planId?.name : null;
      }
      return users;
    };

    if (filter === 'individualUser') {
      totalCount = await individualUser.countDocuments({
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } },
        ],
      });
      totalUser = await fetchUsersWithSubscription(individualUser, search);
    } else if (filter === 'enterpriseUser') {
      totalCount = await enterpriseUser.countDocuments({
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } },
        ],
      });
      totalUser = await fetchUsersWithSubscription(enterpriseUser, search);
    } else if (filter === 'enterpriseEmploye') {
      totalCount = await enterpriseEmployeModel.countDocuments({
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

    // Check if email exists
    const isEmailExist = await individualUser.findOne({ email }).exec();
    if (isEmailExist) {
      return res.status(409).json({ message :"A user with this email address already exists. Please login instead"}); // Correct response handling
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

    // Check if email exists in the enterpriseUser collection
    const isEmailExist = await enterpriseUser.findOne({ email }).exec();
    if (isEmailExist) {
      return res.status(409).json({ message: "An enterprise user with this email address already exists." });
    }

    // Check if email exists in the enterpriseEmployeModel collection
    const isEmpEmailExist = await enterpriseEmployeModel.findOne({ email }).exec();
    if (isEmpEmailExist) {
      return res.status(409).json({ message: "This email address is already associated with an enterprise employee." });
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
      enterpriseId,
      username,
      email,
      passwordRaw,
      businessName,
      empName,
      designation,
      mobile,
      location,
      services,
      image,
      position,
      color,
      website,
    } = req.body;

    // Check for missing fields
    if (!email || !passwordRaw || !enterpriseId || !businessName || !empName || !designation || !mobile || !location || !services || !image || !position || !color || !website) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user email exists
    const isEmailExist = await enterpriseEmployeModel.findOne({ email }).exec();
    const isEmailExistInEnterpriseUser = await enterpriseUser.findOne({ email }).exec();
    if (isEmailExist || isEmailExistInEnterpriseUser) {
      return res.status(409).json({ message: "A user with this email address already exists. Please use another email" });
    }

    // Check if Enterprise ID exists
    const isEnterpriseIDExist = await enterpriseUser.findOne({ _id: enterpriseId }).exec();
    if (!isEnterpriseIDExist) {
      return res.status(409).json({ message: "Enterprise user not found" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(passwordRaw, 10);

    // Handle image URL (upload to S3 if necessary)
    let imageUrl = image;
    if (image) {
      const imageBuffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ""), 'base64');
      const fileName = `${username}-profile.jpg`; // Unique file name based on username
      try {
        const uploadResult = await uploadImageToS3(imageBuffer, fileName);
        imageUrl = uploadResult.Location; // URL of the uploaded image
      } catch (uploadError) {
        console.log("Error uploading image to S3:", uploadError);
        return res.status(500).json({ message: "Failed to upload image", error: uploadError });
      }
    }

    // Create the enterprise employee document
    const newEnterpriseEmployee = await enterpriseEmployeModel.create({
      username,
      email,
      password: hashedPassword,
    });

    if (!newEnterpriseEmployee) {
      return res.status(500).json({ message: "Failed to create enterprise employee" });
    }

    // Create new card
    const newCard = new enterpriseEmployeCardModel({
      userId: newEnterpriseEmployee._id,
      businessName,
      email,
      empName,
      designation,
      mobile,
      location,
      services,
      image: imageUrl,
      position,
      color,
      website,
      enterpriseId,
    });

    const cardResult = await newCard.save();
    if (!cardResult) {
      return res.status(500).json({ message: "Failed to create employee card" });
    }

    // Add the card ID to the enterprise user document
    await enterpriseUser.updateOne(
      { _id: enterpriseId },
      {
        $push: { empCards: cardResult._id }, // Assuming `empCards` is an array field in the EnterpriseUser model
      }
    );

    // Respond with success
    res.status(201).json({ message: "Enterprise employee added successfully with card", user: newEnterpriseEmployee, card: cardResult });
  } catch (error) {
    console.error('Error adding enterprise employee:', error);
    res.status(500).json({ message: "Server error", error });
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
      } else if (enterpriseEmployeeExist.status === "inactive") {
        await enterpriseEmployeModel.updateOne({ _id: userId }, { status: "active" });
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
      individual: ['username', 'email', 'image', 'role', 'name', 'website', 'phnNumber', 'address', 'socialMedia'],
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
    if (requestData.image) {
      if (userExist.image) {
        await deleteImageFromS3(userExist.image); // Delete the old image from S3
      }

      const imageBuffer = Buffer.from(requestData.image.replace(/^data:image\/\w+;base64,/, ""), 'base64');
      const fileName = `${userId}-profile.jpg`;

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