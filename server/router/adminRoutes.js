const router = require("express").Router();
const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const adminController = require("../controllers/adminController");

router.post("/register/admin", adminController.registerAdmin); //Temporary
router.get("/admin/stats", verifyToken, verifyRole("admin"), adminController.getStatus);
router.get("/users", verifyToken, verifyRole("admin"), adminController.getAllUsers);
router.get("/order", verifyToken, verifyRole("admin", "manager"), adminController.getAllOrders);
router.patch("/role/edit/:u_id", verifyToken, verifyRole("admin"), adminController.editRoles);
router.delete("/delete/user/:u_id", verifyToken, verifyRole("admin"), adminController.deleteUser);

module.exports = router;
