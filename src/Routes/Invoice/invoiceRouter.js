const { Router } = require('express');
const controller = require('../../Controller/Invoice/invoiceController')

const router = Router();

router.get("/getInvoices",controller.getInvoices);

module.exports = router;