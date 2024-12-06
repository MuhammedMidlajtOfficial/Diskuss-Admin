const {uploadImageToS3}= require("../../services/AWS/s3Bucket");
const enterpriseEmployeModel = require("../../models/enterpriseEmploye.model");
const enterpriseUser = require("../../models/enterpriseUser");
const individualUser= require("../../models/individualUser");
const userSubscriptionModel = require("../../models/userSubscription.model");
const bcrypt = require('bcrypt');

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
        user.subscriptionPlan = subscription ? subscription.planId.name : null;
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
    if (!companyName || !industryType || !email || !passwordRaw) {
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
      return res.status(200).json({ userData: enterpriseUserExist, userType: 'EnterpriseUser' });
    }

    // Check if the user exists in the EnterpriseEmployee collection
    const enterpriseEmployeeExist = await enterpriseEmployeModel.findById(userId);
    if (enterpriseEmployeeExist) {
      return res.status(200).json({ userData: enterpriseEmployeeExist, userType: 'EnterpriseEmployee' });
    }

    // Check if the user exists in the IndividualUser collection
    const individualUserExist = await individualUser.findById(userId);
    if (individualUserExist) {
      return res.status(200).json({ userData: individualUserExist, userType: 'IndividualUser' });
    }

    // If no user is found in any collection
    return res.status(404).json({ message: 'User not found' });

  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
