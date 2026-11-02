const router = require("express").Router();
const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const adminController = require("../controllers/adminController");

router.post("/register/admin", adminController.registerAdmin); //Temporary
router.get("/admin/stats", verifyToken, verifyRole("admin"), adminController.getStatus);
router.get("/users", verifyToken, verifyRole("admin"), adminController.getAllUsers);
router.patch("/role/edit/:u_id", verifyToken, verifyRole("admin"), adminController.editRoles);
router.delete("/delete/user/:u_id", verifyToken, verifyRole("admin"), adminController.deleteUser);
router.get("/order", verifyToken, verifyRole("admin", "manager"), adminController.getAllOrders);
router.get("/admin/couriers", verifyToken, verifyRole("admin", "manager"), adminController.getCouriers);
router.patch("/admin/order/:o_id", verifyToken, verifyRole("admin", "manager"), adminController.adminEditOrder);
module.exports = router;
