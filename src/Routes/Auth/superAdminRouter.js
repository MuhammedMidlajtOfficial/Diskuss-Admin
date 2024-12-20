const { Router } = require('express');
const controller = require('../../Controller/Auth/superAdminController');
const { validateJwtToken } = require('../../Middlewares/validateJwtToken');

const router = Router();

// Public routes (no JWT validation required)
router.post('/superAdminSignup', controller.postSuperAdminSignup);
router.post('/superAdminLogin', controller.postLogin);


// Protected routes (Add JWT validation for these routes)
router.get('/superAdminDashboard', validateJwtToken); // JWT validation applied here

module.exports = router;