const { Router } = require('express');
const controller = require('../../Controller/Auth/superAdminController');
const router = Router();

// Public routes (no JWT validation required)
router.get('/getSuperAdmin/:id', controller.getSuperAdmin);

router.post('/superAdminSignup', controller.postSuperAdminSignup);
router.post('/superAdminLogin', controller.postLogin);


router.patch('/updateUser/:id', controller.updateUser);

router.patch('/updateUserPassword/:id', controller.updateUserPassword);

router.post('/forgotPassword/request-otp', controller.forgotPasswordRequestOtp);
router.post('/forgotPassword/validate-otp', controller.forgotPasswordValidateOtp);
router.post('/forgotPassword/reset-password', controller.forgotPasswordReset);





module.exports = router;