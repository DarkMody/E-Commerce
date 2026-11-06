const router = require("express").Router();
const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const { validateOrderId } = require("../middlewares/validations");
const deliveryController = require("../controllers/deliveryController");

router.get("/delivery/orders", verifyToken, verifyRole("employee"), deliveryController.getMyOrders);
router.patch("/delivery/order/:o_id", verifyToken, verifyRole("employee"), validateOrderId("o_id"), deliveryController.updateMyOrder);

module.exports = router;
