const router = require("express").Router();
const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const { validateDate } = require("../middlewares/validations");
const managerController = require("../controllers/managerController");
const limit = require("../middlewares/rateLimiters");

router.get("/manager/stats", verifyToken, verifyRole("manager", "admin"), limit.stats, validateDate("start", "end"), managerController.getStats);
router.get("/manager/couriers", verifyToken, verifyRole("manager", "admin"), managerController.getCouriers);

module.exports = router;
