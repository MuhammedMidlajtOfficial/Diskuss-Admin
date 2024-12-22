const EmployeeCategory = require('../../models/employee.category.model');
const EmployeeRole = require('../../models/employee.role.model');
const Employee = require('../../models/employee.model')
const { uploadImageToS3, deleteImageFromS3 } = require("../../services/AWS/s3Bucket");
const nodemailer = require ('nodemailer')
require("dotenv").config();

const EmployeeController = {

  // Creating employee
  createEmployee: async (req, res) => {
    try {
      const { userName, image, email, password, phoneNumber, category } = req.body;
      if (!userName || !image || !email || !password || !phoneNumber || !category) {
        return res.status(400).json({ message: "All fields must be present" });
      }
      const existingEmployee = await Employee.findOne({ email });
      if (existingEmployee) {
        return res.status(409).json({ message: "Employee already exists" });
      }

      let imageUrl;
      // Upload image to S3 if a new image is provided
      if (image) {
        const imageBuffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ""), 'base64');
        const fileName = `${Date.now()}-${userName}-employee-profile.jpg`;
        try {
          const uploadResult = await uploadImageToS3(imageBuffer, fileName);
          imageUrl = uploadResult.Location;
          console.log("Upload result:", uploadResult);
        } catch (uploadError) {
          console.log("Error uploading image to S3:", uploadError);
          return res.status(500).json({ message: "Failed to upload image", error: uploadError });
        }
      }
      const employee = new Employee({ userName, image: imageUrl, email, password, phoneNumber, category });
      console.log("emp:", employee);

      if (!employee) {
        return res.status(509).json({ message: "Employee creation failed" });
      }
      await employee.save();

          // Send an email to the newly created employee
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL, 
      to: email,
      subject: "Welcome to the Company!",
      html: `
        <h1>Welcome, ${userName}!</h1>
        <p>We're excited to have you on board. Here are your details:</p>
        <ul>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Password:</strong> ${password}</li>
          <li><strong>Phone Number:</strong> ${phoneNumber}</li>
          <li><strong>Category:</strong> ${category}</li>
          <li><strong>Profile Image:</strong> <a href="${imageUrl}">View Image</a></li>
        </ul>
        <p>Keep this information safe and feel free to contact us if you have any questions.</p>
      `,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.log("Error sending email:", err);
        return res.status(500).json({ message: "Employee created, but email failed", error: err.message });
      }
      console.log("Email sent:", info.response);
    });


      return res.status(201).json({ message: "Employee created successfully", employee });
    } catch (error) {
      return res.status(500).json({ message: "Error creating employee", error: error.message });
    }
  },

  // Getting all employees
  getEmployees: async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const totalEmployees = await Employee.countDocuments();
      const employees = await Employee.find()
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      res.status(200).json({
        success: true,
        page: Number(page),
        totalEmployees: totalEmployees,
        totalPages: Math.ceil(totalEmployees / limit),
        employees: employees,
      });
    } catch (error) {
      console.error("Error fetching employees:", error.message);
      res.status(500).json({ message: "Error fetching employees", error: error.message });
    }
  },

  // Updating employee
  updateEmployee: async (req, res) => {
    try {
      const { employeeId } = req.params;
      const { email, image, ...otherData } = req.body;

      const employee = await Employee.findById(employeeId);
      if (!employee) {
        return res.status(404).json({ success: false, message: "Employee not found" });
      }

      if (email && email !== employee.email) {
        const existingEmployee = await Employee.findOne({ email });
        if (existingEmployee && existingEmployee._id.toString() !== employeeId) {
          return res.status(400).json({
            success: false,
            message: "Email is already in use by another employee",
          });
        }
      }

      let imageUrl = employee.image;

      if (image) {
        if (employee.image) {
          const oldImageKey = employee.image.split('/').pop();
          try {
            await deleteImageFromS3(oldImageKey);
          } catch (deleteError) {
            console.error("Error deleting old image from S3:", deleteError);
          }
        }

        const imageBuffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ""), 'base64');
        const fileName = `${Date.now()}-${employee.userName}-employee-profile.jpg`;
        try {
          const uploadResult = await uploadImageToS3(imageBuffer, fileName);
          imageUrl = uploadResult.Location;
        } catch (uploadError) {
          console.error("Error uploading new image to S3:", uploadError);
          return res.status(500).json({ message: "Failed to upload new image", error: uploadError });
        }
      }
      const updatedEmployee = await Employee.findByIdAndUpdate(
        employeeId,
        { $set: { email, image: imageUrl, ...otherData } },
        { new: true, runValidators: true }
      );

      if (!updatedEmployee) {
        return res.status(404).json({ success: false, message: "Employee not found" });
      }

      res.status(200).json({
        success: true,
        message: "Employee updated successfully",
        employee: updatedEmployee,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
  },

  // Delete employee
  deleteEmployee: async (req, res) => {
    try {
      const { employeeId } = req.params;
      const employee = await Employee.findById(employeeId);
      if (!employee) {
        return res.status(404).json({ success: false, message: "Employee not found" });
      }
      if (employee.image) {
        const imageKey = employee.image.split('/').pop();
        try {
          await deleteImageFromS3(imageKey);
        } catch (deleteError) {
          console.error("Error deleting image from S3:", deleteError);
        }
      }
      const deletedEmployee = await Employee.findByIdAndDelete(employeeId);
      if (!deletedEmployee) {
        return res.status(404).json({ success: false, message: "Employee not found" });
      }
      res.status(200).json({
        success: true,
        message: "Employee deleted successfully",
        employee: deletedEmployee,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
  }
  ,


  // // Login employee
  // loginEmployee: async (req, res) => {
  //   try {
  //     const { email, password } = req.body;
  //     if (!email || !password) {
  //       return res.status(400).json({
  //         success: false,
  //         message: "Email and password are required.",
  //       });
  //     }
  //     const employee = await Employee.findOne({ email });
  //     if (!employee) {
  //       return res.status(404).json({
  //         success: false,
  //         message: "Employee not found.",
  //       });
  //     }

  //     const isPasswordValid = await employee.isPasswordCorrect(password);
  //     if (!isPasswordValid) {
  //       return res.status(401).json({
  //         success: false,
  //         message: "Invalid credentials.",
  //       });
  //     }
  //     const accessToken = await employee.generateAuthToken();
  //     const refreshToken = await employee.generateRefreshToken();

  //     res.status(200).json({
  //       success: true,
  //       message: "Login successful.",
  //       accessToken,
  //       refreshToken,
  //       employee: {
  //         id: employee._id,
  //         fullName: employee.fullName,
  //         userName: employee.userName,
  //         email: employee.email,
  //         phoneNumber: employee.phoneNumber,
  //         category: employee.category,
  //         userImage: employee.userImage,
  //       },
  //     });
  //   } catch (error) {
  //     res.status(500).json({
  //       success: false,
  //       message: "Internal Server Error.",
  //     });
  //   }
  // },

}

const EmployeeRoleController = {

  // Creating Role
  createRole: async (req, res) => {
    try {
      const { roleName, isActive } = req.body;
      if (!roleName || isActive === undefined) {
        return res.status(400).json({ message: "All fields must be present" });
      }
      const uppercaseRoleName = roleName.toUpperCase()
      const existingRole = await EmployeeRole.findOne({ roleName: uppercaseRoleName });
      if (existingRole) {
        return res.status(409).json({ message: "Role already exists" });
      }
      const role = new EmployeeRole({ roleName, isActive });
      await role.save();

      return res.status(201).json({ message: "Role created successfully", role });
    } catch (error) {
      return res.status(500).json({ message: "Error creating role", error: error.message });
    }
  },

  // Getting All Roles
  getRoles: async (req, res) => {
    try {
      const roles = await EmployeeRole.find();
      res.status(200).json(roles);
    } catch (error) {
      res.status(500).json({ message: "Error fetching roles", error: error.message });
    }
  },

  // Updating Role
  updateRole: async (req, res) => {
    try {
      const { id } = req.params;
      if (!(await EmployeeRole.findById(id))) {
        res.status(404).json({ message: "Role not found" });
      }
      const updates = req.body;

      const uppercaseRoleName = updates.roleName.toUpperCase()
      const existingRole = await EmployeeRole.findOne({ roleName: uppercaseRoleName });
      if (existingRole) {
        return res.status(409).json({ message: "Role already exists" });
      }

      const updatedRole = await EmployeeRole.findByIdAndUpdate(id, updates, { new: true });
      if (!updatedRole) return res.status(501).json({ message: "Something went wrong" });
      res.status(200).json({ message: "Role updated successfully", updatedRole });
    } catch (error) {
      res.status(500).json({ message: "Error updating role", error: error.message });
    }
  },

  // Deleting Role
  deleteRole: async (req, res) => {
    try {
      const { id } = req.params;
      if (!(await EmployeeRole.findById(id))) {
        res.status(404).json({ message: "Role not found" });
      }
      const deletedRole = await EmployeeRole.findByIdAndDelete(id);
      if (!deletedRole) return res.status(504).json({ message: "Something went wrong" });
      res.status(200).json({ message: "Role deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting role", error: error.message });
    }
  },

  // For toggle isActive for Role
  toggleIsActive: async (req, res) => {
    try {
      const { id } = req.params;
      const role = await EmployeeRole.findById(id);
      if (!role) return res.status(404).json({ message: "Role not found" });
      role.isActive = !role.isActive;
      await role.save();
      res.status(200).json({ message: "Role status updated", role });
    } catch (error) {
      res.status(500).json({ message: "Error updating status", error: error.message });
    }
  },

  // // Getting Role count
  // getRolesCounts: async (req, res) => {
  //   try {
  //     const roles = await EmployeeRole.find();
  //     const totalRoles = roles.length
  //     const totalActive = roles.filter((role) => role.isActive).length;
  //     const cardData = [{
  //       "title": "Total Roles",
  //       "value": totalRoles
  //     },
  //     {
  //       "title": "Total active Roles",
  //       "value": totalActive
  //     }]
  //     res.status(200).json(cardData);
  //   } catch (error) {
  //     res.status(500).json({ message: "Error fetching roles", error: error.message });
  //   }
  // },

};

const EmployeeCategoryController = {
  // Creating Category
  createCategory: async (req, res) => {
    try {
      const { categoryName, isActive, roles } = req.body;
      if (!categoryName) {
        res.status(404).json({ message: "Category Name is Needed" })
      }
      const uppercaseCategoryName = categoryName.toUpperCase()
      const existingCategory = await EmployeeRole.findOne({ categoryName: uppercaseCategoryName });
      if (existingCategory) {
        return res.status(409).json({ message: "Category already exists" });
      }
      const category = new EmployeeCategory({ categoryName, isActive, roles });
      await category.save();
      res.status(201).json({ message: "Category created successfully", category });
    } catch (error) {
      res.status(500).json({ message: "Error creating category", error: error.message });
    }
  },

  // Getting All Categories
  getCategories: async (req, res) => {
    try {
      const categories = await EmployeeCategory.find().populate("roles");
      res.status(200).json(categories);
    } catch (error) {
      res.status(500).json({ message: "Error fetching categories", error: error.message });
    }
  },

  // Updating Category
  updateCategory: async (req, res) => {
    try {
      const { id } = req.params;
      if (!(await EmployeeCategory.findById(id))) {
        res.status(404).json({ message: "Category not found" });
      }
      const updates = req.body;
      const uppercaseCategoryName = updates.categoryName.toUpperCase()
      const existingCategory = await EmployeeRole.findOne({ categoryName: uppercaseCategoryName });
      if (existingCategory) {
        return res.status(409).json({ message: "Category already exists" });
      }
      const updatedCategory = await EmployeeCategory.findByIdAndUpdate(id, updates, { new: true }).populate("roles");
      if (!updatedCategory) return res.status(404).json({ message: "Category not found" });
      res.status(200).json({ message: "Category updated successfully", updatedCategory });
    } catch (error) {
      res.status(500).json({ message: "Error updating category", error: error.message });
    }
  },

  // Deleting Category
  deleteCategory: async (req, res) => {
    try {
      const { id } = req.params;
      if (!(await EmployeeCategory.findById(id))) {
        res.status(404).json({ message: "Category not found" });
      }
      const deletedCategory = await EmployeeCategory.findByIdAndDelete(id);
      if (!deletedCategory) return res.status(504).json({ message: "Something went wrong" });
      res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting category", error: error.message });
    }
  },

  // For toggle isActive for Category
  toggleIsActive: async (req, res) => {
    try {
      const { id } = req.params;
      const category = await EmployeeCategory.findById(id);
      if (!category) return res.status(404).json({ message: "Category not found" });
      category.isActive = !category.isActive;
      await category.save();
      res.status(200).json({ message: "Category status updated", category });
    } catch (error) {
      res.status(500).json({ message: "Error updating status", error: error.message });
    }
  },

  // // Getting Category count
  // getCategoryCounts: async (req, res) => {
  //   try {
  //     const category = await EmployeeCategory.find();
  //     const totalRoles = category.length
  //     const totalActive = category.filter((role) => role.isActive).length;
  //     const cardData = [{
  //       "title": "Total category",
  //       "value": totalRoles
  //     },
  //     {
  //       "title": "Total active category",
  //       "value": totalActive
  //     }]
  //     res.status(200).json(cardData);
  //   } catch (error) {
  //     res.status(500).json({ message: "Error fetching category", error: error.message });
  //   }
  // }, 

};

module.exports = { EmployeeRoleController, EmployeeCategoryController, EmployeeController };