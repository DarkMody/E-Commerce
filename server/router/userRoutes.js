const router = require("express").Router();
const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const imageValidating = require("../middlewares/imageChecking");
const userController = require("../controllers/userController");

router.get("/user", verifyToken, userController.getUser);
router.post("/register/user", userController.registerUser);
router.post("/login", userController.login);
router.post("/logout", verifyToken, userController.logout);
router.delete("/user/delete/:u_id", verifyToken, userController.deleteUser);
router.patch(
  "/user/edit/:u_id",
  verifyToken,
  imageValidating.profileImageValidating,
  userController.editUser,
);
router.patch("/user/password", verifyToken, userController.changePassword);

module.exports = router;
