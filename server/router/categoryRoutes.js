const router = require("express").Router();
const categoryController = require("../controllers/categoryController");
const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");

router.get("/category", categoryController.getAllCategories);

module.exports = router;
