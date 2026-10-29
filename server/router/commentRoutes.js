const router = require("express").Router();
const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const commentController = require("../controllers/commentController");

router.get("/comment/:p_id", commentController.getProductComments);
router.get("/comment/me/:p_id", verifyToken, commentController.getMyComment);
router.post("/comment/:p_id", verifyToken, commentController.addComment);
router.patch("/comment/:c_id", verifyToken, commentController.editComment);
router.delete("/comment/:c_id", verifyToken, commentController.deleteComment);

module.exports = router;
