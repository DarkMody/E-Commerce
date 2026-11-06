const router = require("express").Router();
const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const imageValidating = require("../middlewares/imageChecking");
const { validateUUID, validateEmail } = require("../middlewares/validations");
const userController = require("../controllers/userController");
const limit = require("../middlewares/rateLimiters");

router.get("/user", verifyToken, userController.getUser);
router.post("/register/user", limit.register, validateEmail("email"), userController.registerUser);
router.post("/login", limit.login, validateEmail("email"), userController.login);
router.post("/logout", verifyToken, userController.logout);
router.delete("/user/delete/:u_id", verifyToken, validateUUID("u_id"), userController.deleteUser);
router.patch(
  "/user/edit/:u_id",
  verifyToken,
  limit.uploads,
  validateUUID("u_id"),
  validateEmail("email", false),
  imageValidating.profileImageValidating,
  userController.editUser,
);
router.patch("/user/password", verifyToken, limit.changePassword, userController.changePassword);

module.exports = router;
