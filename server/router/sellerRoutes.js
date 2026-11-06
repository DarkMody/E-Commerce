const router = require("express").Router();
const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const { validateDate, validateEmail } = require("../middlewares/validations");
const sellerController = require("../controllers/sellerController");
const productController = require("../controllers/productController");
const limit = require("../middlewares/rateLimiters");

router.post("/register/seller", limit.register, validateEmail("email"), sellerController.registerSeller);
router.get("/seller/product", verifyToken, verifyRole("seller"), productController.getSellerProducts);
router.get("/seller/stats", verifyToken, verifyRole("seller"), limit.stats, validateDate("start", "end"), sellerController.getStats);
router.get("/seller/orders", verifyToken, verifyRole("seller"), sellerController.getOrders);

module.exports = router;
