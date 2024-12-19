const { Router } = require('express');
const controller = require('../../Controller/Analytics/analyticController')


const router = Router();

router.get('/', controller.getAnalytics)
router.get('/all', controller.getAllAnalytics)
router.post('/share', controller.logShare)
router.post('/view', controller.logView)
router.post('/click', controller.logClick)

router.get('/meeting/enterprise/:enterpriseId', controller.getEnterpriseMeetings)
router.get('/meeting/individual/:individualId', controller.getIndividualMeetings)
router.get('/card/:enterpriseId', controller.getCards)
router.get('/employee/:enterpriseId', controller.getEmployees)
router.get('/count/:enterpriseId', controller.getCounts);


module.exports = router;

