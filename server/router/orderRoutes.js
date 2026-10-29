const router = require("express").Router();
const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const orderController = require("../controllers/orderController");

router.get("/user/order", verifyToken, orderController.getOrders);
router.post("/order", verifyToken, orderController.makeOrder);
router.patch("/order/:o_id", verifyToken, orderController.editOrder);
router.get("/order/product/:o_id", verifyToken, orderController.getOrderProduct);

module.exports = router;
