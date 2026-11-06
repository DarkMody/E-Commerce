const router = require("express").Router();
const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const imageValidating = require("../middlewares/imageChecking");
const { validateUUID } = require("../middlewares/validations");
const productController = require("../controllers/productController");
const limit = require("../middlewares/rateLimiters");

router.get("/products", productController.getAllProducts);
router.get("/products/:p_id", validateUUID("p_id"), productController.getProduct);
router.post("/product/add", verifyToken, limit.uploads, imageValidating.productImageValidating, productController.addProduct);
router.delete("/product/delete/:p_id", verifyToken, validateUUID("p_id"), productController.deleteProduct);
router.patch("/product/edit/:p_id", verifyToken, limit.uploads, validateUUID("p_id"), imageValidating.productImageValidating, productController.editProduct);
router.get("/product/me/:p_id", verifyToken, validateUUID("p_id"), productController.boughtProduct);

module.exports = router;
