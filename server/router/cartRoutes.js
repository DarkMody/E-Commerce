const router = require("express").Router();
const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const cartController = require("../controllers/cartController");

router.get("/cart", verifyToken, cartController.getCart);
router.get("/cart/:p_id", verifyToken, cartController.isInCart);
router.post("/cart/:p_id", verifyToken, cartController.addToCart);
router.delete("/cart/:p_id", verifyToken, cartController.deleteFromCart);
router.patch("/cart/:p_id", verifyToken, cartController.editCart);

module.exports = router;
