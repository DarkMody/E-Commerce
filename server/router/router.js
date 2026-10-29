const router = require("express").Router();

router.use(require("./userRoutes"));
router.use(require("./productRoutes"));
router.use(require("./categoryRoutes"));
router.use(require("./commentRoutes"));
router.use(require("./cartRoutes"));
router.use(require("./orderRoutes"));
router.use(require("./adminRoutes"));
router.use(require("./sellerRoutes"));
router.use(require("./managerRoutes"));

module.exports = router;