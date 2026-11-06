const router = require("express").Router();
const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const { validateUUID } = require("../middlewares/validations");
const commentController = require("../controllers/commentController");

router.get("/comment/:p_id", validateUUID("p_id"), commentController.getProductComments);
router.get("/comment/me/:p_id", verifyToken, validateUUID("p_id"), commentController.getMyComment);
router.post("/comment/:p_id", verifyToken, validateUUID("p_id"), commentController.addComment);
router.patch("/comment/:c_id", verifyToken, validateUUID("c_id"), commentController.editComment);
router.delete("/comment/:c_id", verifyToken, validateUUID("c_id"), commentController.deleteComment);

module.exports = router;
