const { Router } = require('express');
const controller = require('../../Controller/Auth/superAdminController');
const router = Router();

// Public routes (no JWT validation required)
router.get('/getSuperAdmin/:id', controller.getSuperAdmin);

router.post('/superAdminSignup', controller.postSuperAdminSignup);
router.post('/superAdminLogin', controller.postSuperAdminLogin);

router.patch('/updateSuperAdmin/:id', controller.updateSuperAdmin);

module.exports = router;