const router = require("express").Router();
const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const { validateUUID } = require("../middlewares/validations");
const cartController = require("../controllers/cartController");

router.get("/cart", verifyToken, cartController.getCart);
router.get("/cart/:p_id", verifyToken, validateUUID("p_id"), cartController.isInCart);
router.post("/cart/:p_id", verifyToken, validateUUID("p_id"), cartController.addToCart);
router.delete("/cart/:p_id", verifyToken, validateUUID("p_id"), cartController.deleteFromCart);
router.patch("/cart/:p_id", verifyToken, validateUUID("p_id"), cartController.editCart);

module.exports = router;
