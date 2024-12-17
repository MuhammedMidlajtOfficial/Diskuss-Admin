const { Router } = require('express');
const controller = require('../../Controller/UserManagement/userCotroller')

const router = Router();

router.get('/getAllUser/:filter',controller.getAllUsers)
router.get('/changeUserStatus/:id',controller.changeUserStatus)
router.get('/getUserById/:id',controller.getUserById)

router.patch('/updateProfile/:id', controller.updateProfile);

router.post('/addIndividualUser',controller.addIndividualUser)
router.post('/addEnterpriseUser',controller.addEnterpriseUser)
router.post('/addEnterpriseEmployee',controller.addEnterpriseEmployee)

// Enterprise User Management
router.get('/getEnterpriseUserCount',controller.getEnterpriseUserCount)
router.get('/getEnterpriseUser',controller.getEnterpriseUser)

module.exports = router;