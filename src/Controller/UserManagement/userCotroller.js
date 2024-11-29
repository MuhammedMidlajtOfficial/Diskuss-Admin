const { uploadImageToS3 } = require("../../Services/AWS/s3Bucket");
const enterpriseEmployeModel = require("../../models/enterpriseEmploye.model");
const enterpriseUser = require("../../models/enterpriseUser");
const {individualUser} = require("../../models/individualUser");
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