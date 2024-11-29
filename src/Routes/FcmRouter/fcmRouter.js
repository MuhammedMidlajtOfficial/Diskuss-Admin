const { Router } = require('express');
const controller = require('../../Controller/Fcm/fcmController')

const router = Router();

router.get('/getAllFcmId',controller.getAllFcmId)
router.post('/postFcmId',controller.postFcmId)

module.exports = router;