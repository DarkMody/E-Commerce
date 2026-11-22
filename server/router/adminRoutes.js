const router = require("express").Router();
const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const {
  validateUUID,
  validateDate,
  validateOrderId,
  validateEmail,
} = require("../middlewares/validations");
const adminController = require("../controllers/adminController");
const limit = require("../middlewares/rateLimiters");

// router.post("/register/admin", limit.register, validateEmail("email"), adminController.registerAdmin); //Temporary
router.get("/admin/stats", verifyToken, verifyRole("admin"), limit.stats, validateDate("start", "end"), adminController.getStatus);
router.get("/users", verifyToken, verifyRole("admin"), adminController.getAllUsers);
router.patch("/role/edit/:u_id", verifyToken, verifyRole("admin"), validateUUID("u_id"), adminController.editRoles);
router.delete("/delete/user/:u_id", verifyToken, verifyRole("admin"), validateUUID("u_id"), adminController.deleteUser);
router.get("/order", verifyToken, verifyRole("admin", "manager"), adminController.getAllOrders);
router.get("/admin/couriers", verifyToken, verifyRole("admin", "manager"), adminController.getCouriers);
router.patch("/admin/order/:o_id", verifyToken, verifyRole("admin", "manager"), validateOrderId("o_id"), validateUUID("courierId"), adminController.adminEditOrder);
router.get("/admin/check-products", verifyToken, verifyRole("admin", "manager"), adminController.getCheckProducts);
router.post("/admin/check-product/:p_id/accept", verifyToken, verifyRole("admin", "manager"), validateUUID("p_id"), adminController.acceptProduct);
router.post("/admin/check-product/:p_id/reject", verifyToken, verifyRole("admin", "manager"), validateUUID("p_id"), adminController.rejectProduct);
module.exports = router;
