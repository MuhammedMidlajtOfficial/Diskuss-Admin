const { Router } = require('express');
const controller = require('../../Controller/UserManagement/userCotroller')

const router = Router();

router.get('/getAllUser/:filter',controller.getAllUsers) // filter => individualUser, enterpriseUser, enterpriseEmploye
router.post('/addIndividualUser',controller.addIndividualUser)

module.exports = router;