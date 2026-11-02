const router = require("express").Router();
const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const employeeController = require("../controllers/employeeController");

router.patch(
  "/employee/order/:o_id",
  verifyToken,
  verifyRole("employee"),
  employeeController.employeeEditOrder,
);

module.exports = router;
