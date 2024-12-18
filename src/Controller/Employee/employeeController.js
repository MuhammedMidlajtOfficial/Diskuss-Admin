const EmployeeCategory = require("../../models/employee.category.model");
const EmployeeRole = require("../../models/employee.role.model");

const EmployeeRoleController = {
    
  // Creating Role
  createRole: async (req, res) => {
    try {
      const { roleName, isActive } = req.body;
      if (!roleName || isActive === undefined) {
        return res.status(400).json({ message: "All fields must be present" });
      }
      const existingRole = await EmployeeRole.findOne({ roleName });
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

  // Updating Role
  updateRole: async (req, res) => {
    try {
      const { id } = req.params;
      if(!(await EmployeeRole.findById(id))){
        res.status(404).json({ message: "Role not found" });
      }
      const updates = req.body;
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
      if(!(await EmployeeRole.findById(id))){
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
};

const EmployeeCategoryController = {
  // Creating Category
  createCategory: async (req, res) => {
    try {
      const { categoryName, isActive, roles } = req.body;
      if(!categoryName){
        res.status(404).json({ message: "Category Name is Needed"})
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

  // Updating Category
  updateCategory: async (req, res) => {
    try {
      const { id } = req.params;
      if(!(await EmployeeCategory.findById(id))){
        res.status(404).json({message: "Category not found"});
      }
      const updates = req.body;
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
      if(!(await EmployeeCategory.findById(id))){
        res.status(404).json({message: "Category not found"});
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
};

module.exports = { EmployeeRoleController, EmployeeCategoryController };