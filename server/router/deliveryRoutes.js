const router = require("express").Router();
const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const deliveryController = require("../controllers/deliveryController");

router.get("/delivery/orders", verifyToken, verifyRole("employee"), deliveryController.getMyOrders);
router.patch("/delivery/order/:o_id", verifyToken, verifyRole("employee"), deliveryController.updateMyOrder);

module.exports = router;