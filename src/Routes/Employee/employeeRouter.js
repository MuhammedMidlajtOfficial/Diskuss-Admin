const express = require('express');
const router = express.Router();
const { EmployeeRoleController, EmployeeCategoryController, EmployeeController } = require('../../Controller/Employee/employeeController');

// Employee 
router.post('/', EmployeeController.createEmployee);
router.get('/', EmployeeController.getEmployees);
router.put('/:employeeId', EmployeeController.updateEmployee);
router.delete('/:employeeId', EmployeeController.deleteEmployee);

// router.post('/login', EmployeeController.loginEmployee)

// Employee Role
router.post('/roles', EmployeeRoleController.createRole);
router.get('/roles', EmployeeRoleController.getRoles);
router.put('/roles/:id', EmployeeRoleController.updateRole);
router.delete('/roles/:id', EmployeeRoleController.deleteRole);
router.patch('/roles/:id/toggle-active', EmployeeRoleController.toggleIsActive);
// router.get('/roles-count', EmployeeRoleController.getRolesCounts)

// Employee Category
router.post('/categories', EmployeeCategoryController.createCategory);
router.get('/categories', EmployeeCategoryController.getCategories);
// router.get('/category-count', EmployeeCategoryController.getCategoryCounts)
router.put('/categories/:id', EmployeeCategoryController.updateCategory);
router.delete('/categories/:id', EmployeeCategoryController.deleteCategory);
router.patch('/categories/:id/toggle-active', EmployeeCategoryController.toggleIsActive);

module.exports = router;
