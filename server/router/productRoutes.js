const router = require("express").Router();
const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const imageValidating = require("../middlewares/imageChecking");
const productController = require("../controllers/productController");

router.get("/products", productController.getAllProducts);
router.get("/products/:p_id", productController.getProduct);
router.post("/product/add",verifyToken,imageValidating.productImageValidating
  ,productController.addProduct);
router.delete("/product/delete/:p_id", verifyToken, productController.deleteProduct);
router.patch("/product/edit/:p_id",verifyToken,imageValidating.productImageValidating
  ,productController.editProduct);

module.exports = router;
