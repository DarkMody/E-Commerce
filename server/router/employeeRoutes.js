const router = require("express").Router();
const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const { validateOrderId } = require("../middlewares/validations");
const employeeController = require("../controllers/employeeController");

router.patch(
  "/employee/order/:o_id",
  verifyToken,
  verifyRole("employee"),
  validateOrderId("o_id"),
  employeeController.employeeEditOrder,
);

module.exports = router;
