const router = require("express").Router();
const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const { validatePhone, validateOrderId } = require("../middlewares/validations");
const orderController = require("../controllers/orderController");
const limit = require("../middlewares/rateLimiters");

router.get("/user/order", verifyToken, orderController.getOrders);
router.post("/order", verifyToken, limit.makeOrder, validatePhone("phoneNumber"), orderController.makeOrder);
router.patch("/order/:o_id", verifyToken, validateOrderId("o_id"), validatePhone("phoneNumber", false), orderController.editOrder);
router.get("/order/product/:o_id", verifyToken, validateOrderId("o_id"), orderController.getOrderProduct);

module.exports = router;
