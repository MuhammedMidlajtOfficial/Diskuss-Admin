const { Router } = require('express');
const controller = require('../../Controller/Dashboard/overviewController')

const router = Router();

router.get('/getTotalCount',controller.getTotalCount)
router.get('/getCountIndividualUsers',controller.getIndividualUsersCount)
router.get('/getCountEnterpriseUsers',controller.getEnterpriseUsersCount)
router.get('/getCountEnterpriseEmployee',controller.getEnterpriseEmployeeCount)
router.get('/getTotalCards',controller.getTotalCards)
router.get('/getNewUsers',controller.getNewUsers)
router.get('/getSubscribedUsers',controller.getSubscribedUsers)
router.get('/getFailedPayment',controller.getFailedPayment)
router.get('/getActiveUsers',controller.getActiveUsers)
router.get('/getJobOverviewData',controller.getJobOverviewData)
router.get('/getTodaysActiveUsers/:date', controller.getTodaysActiveUsers);
router.get('/getPlanMembers/:date', controller.getPlanMembers);
router.get('/getUserPercentage', controller.getUserPercentage);
router.get('/getRecentRegister/:user', controller.getRecentRegister);

module.exports = router;