const enterpriseEmployeModel = require("../../models/enterpriseEmploye.model");
const enterpriseUser = require("../../models/enterpriseUser");
const { individualUser } = require("../../models/individualUser");


module.exports.getAllUsers = async (req, res) => {
  try {
    const { filter } = req.params; // Filter from route parameters
    const { page = 1, pageSize , sortField = 'username', sortOrder = 'asc' } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(pageSize, 10);
    const limitValue = parseInt(pageSize, 10);
    const sort = { [sortField]: sortOrder === 'asc' ? 1 : -1 };

    let totalUser = [];
    let totalCount = 0;

    // Query for individualUser collection
    if (filter === 'individualUser') {
      totalCount = await individualUser.countDocuments();
      totalUser = await individualUser.find().sort(sort).skip(skip).limit(limitValue);
    } 
    // Query for enterpriseUser collection
    else if (filter === 'enterpriseUser') {
      totalCount = await enterpriseUser.countDocuments();
      totalUser = await enterpriseUser.find().sort({ companyName: sortOrder === 'asc' ? 1 : -1 }).skip(skip).limit(limitValue);
    }
    // Query for enterpriseEmployee collection
    else if (filter === 'enterpriseEmploye') {
      totalCount = await enterpriseEmployeModel.countDocuments();
      totalUser = await enterpriseEmployeModel.find().sort(sort).skip(skip).limit(limitValue);
    } 
    // Combine all users and apply pagination manually
    else {
      // Query all collections with pagination
      const IndividualUsers = await individualUser.find().sort(sort).skip(skip).limit(limitValue);
      const EnterpriseUsers = await enterpriseUser.find().sort(sort).skip(skip).limit(limitValue);
      const EnterpriseEmployees = await enterpriseEmployeModel.find().sort(sort).skip(skip).limit(limitValue);

      totalUser = [...IndividualUsers, ...EnterpriseUsers, ...EnterpriseEmployees];
      totalCount = totalUser.length;  // Total count of all combined users
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
