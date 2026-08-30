require("dotenv").config();
const pool = require("./config/db");
const express = require("express");
const cors = require("cors");
const app = express();
const multer = require("multer");
const path = require("path");
const { diskStorage, fileFilter } = require("./utils/image");
const upload = multer({ storage: diskStorage, fileFilter });
const imageValidating = require("./middlewares/imageChecking");
const port = process.env.PORT || 5000;
const userController = require("./controllers/userController");
const productController = require("./controllers/productController");
const commentController = require("./controllers/commentController");
const createTables = require("./data/createTables");
const verifyToken = require("./middlewares/verifyToken");
const verifyRole = require("./middlewares/verifyRole");
const cookieParser = require("cookie-parser");
const FrontURL = "http://localhost:3000";

app.use(cookieParser());
app.use(
  cors({
    origin: FrontURL, // your frontend URL
    credentials: true, // allows cookies to be sent cross-origin
  }),
);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.json());
// Connecting DB & Server & Tables
pool.connect().then(() => {
  console.log("connected");
  createTables();
});
app.listen(port, () => {
  console.log(`Working on port ${port}`);
});

// User APIS
app.get(
  "/api/users",
  verifyToken,
  verifyRole("admin", "manager"),
  userController.getAllUsers,
);
app.get("/api/user", verifyToken, userController.getUser);
app.post("/api/register/user", userController.registerUser);
app.post("/api/register/seller", userController.registerSeller);
app.post("/api/register/admin", userController.registerAdmin); // Temporary
app.post("/api/login", userController.login);
app.post("/api/logout", verifyToken, userController.logout);
app.delete("/api/user/delete/:u_id", verifyToken, userController.deleteUser);
app.patch("/api/user/edit/:u_id", verifyToken, userController.editUser);

//Product APIS
app.get("/api/products", productController.getAllProducts);
app.get(
  "/api/seller/product",
  verifyToken,
  productController.getSellerProducts,
);
app.get("/api/products/:p_id", productController.getProduct);
app.post(
  "/api/product/add",
  verifyToken,
  imageValidating,
  productController.addProduct,
);
app.delete(
  "/api/product/delete/:p_id",
  verifyToken,
  productController.deleteProduct,
);
app.patch(
  "/api/product/edit/:p_id",
  verifyToken,
  imageValidating,
  productController.editProduct,
);

//Comment APIS
app.get("/api/comment/:p_id", commentController.getProductComments);
app.get("/api/comment/me/:p_id", verifyToken, commentController.getMyComment);
app.post("/api/comment/:p_id", verifyToken, commentController.addComment);
app.patch("/api/comment/:c_id", verifyToken, commentController.editComment);
app.delete("/api/comment/:c_id", verifyToken, commentController.deleteComment);

// Error Handeling
app.use((req, res) => {
  res.status(404).send("Route Not Found");
});

app.use((error, req, res, next) => {
  res.status(error.statusCode || 500).json({
    status: error.statusText || "Error",
    message: error.message || error.msg,
  });
});
