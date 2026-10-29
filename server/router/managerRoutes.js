const router = require("express").Router();
const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const managerController = require("../controllers/managerController");

router.get("/manager/stats", verifyToken, verifyRole("manager", "admin"), managerController.getStats);

module.exports = router;
