const router = require("express").Router();
const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const sellerController = require("../controllers/sellerController");
const productController = require("../controllers/productController");

router.post("/register/seller", sellerController.registerSeller);
router.get("/seller/product", verifyToken, verifyRole("seller"), productController.getSellerProducts);
router.get("/seller/stats", verifyToken, verifyRole("seller"), sellerController.getStats);
router.get("/seller/orders", verifyToken, verifyRole("seller"), sellerController.getOrders);

module.exports = router;
