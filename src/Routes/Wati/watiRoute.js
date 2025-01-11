const express = require("express");
const watiController = require("../../Controller/Wati/watiController");

const router = express.Router();

router.post("/", watiController.create);
router.get("/", watiController.getAll);
router.get("/:id", watiController.getById);
router.put("/:id", watiController.update);
router.delete("/:id", watiController.delete);

module.exports = router;