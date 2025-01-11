const express = require("express");
const configController = require("../../Controller/Config/configController");

const router = express.Router();

router.get("/", configController.getAllConfig);
router.get("/:id", configController.getSingleConfig);
router.post("/", configController.createConfig);
router.patch("/", configController.updateConfig);
router.delete("/", configController.deleteConfig);

module.exports = router;
