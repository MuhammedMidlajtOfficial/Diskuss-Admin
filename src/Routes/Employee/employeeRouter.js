const express = require('express');
const router = express.Router();
const { EmployeeRoleController, EmployeeCategoryController } = require('../../Controller/Employee/employeeController');

// Employee Role

router.post('/roles', EmployeeRoleController.createRole);
router.get('/roles', EmployeeRoleController.getRoles);
router.put('/roles/:id', EmployeeRoleController.updateRole);
router.delete('/roles/:id', EmployeeRoleController.deleteRole);
router.patch('/roles/:id/toggle-active', EmployeeRoleController.toggleIsActive);

// Employee Category
router.post('/categories', EmployeeCategoryController.createCategory);
router.get('/categories', EmployeeCategoryController.getCategories);
router.put('/categories/:id', EmployeeCategoryController.updateCategory);
router.delete('/categories/:id', EmployeeCategoryController.deleteCategory);
router.patch('/categories/:id/toggle-active', EmployeeCategoryController.toggleIsActive);

module.exports = router;