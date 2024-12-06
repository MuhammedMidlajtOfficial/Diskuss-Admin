const { Router } = require('express');
const controller = require('../../Controller/UserManagement/userCotroller')

const router = Router();

router.get('/getAllUser/:filter',controller.getAllUsers)
router.get('/changeUserStatus/:id',controller.changeUserStatus)

router.post('/addIndividualUser',controller.addIndividualUser)
router.post('/addEnterpriseUser',controller.addEnterpriseUser)
router.post('/addEnterpriseEmployee',controller.addEnterpriseEmployee)

module.exports = router;