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
const createTables = require("./data/createTables");
const verifyToken = require("./middlewares/verifyToken");
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
app.get("/api/users", userController.getAllUsers);
app.get("/api/user", verifyToken, userController.getUser);
app.post("/api/register/user", userController.registerUser);
app.post("/api/register/seller", userController.registerSeller);
app.post("/api/login", userController.login);
app.post("/api/logout", verifyToken, userController.logout);

//Product APIS
app.get("/api/products", productController.getAllProducts);
app.get(
  "/api/seller/product",
  verifyToken,
  productController.getSellerProducts,
);
app.get("/api/product/:p_id", productController.getProduct);
app.post(
  "/api/product/add",
  verifyToken,
  imageValidating,
  productController.addProduct,
);
app.delete("/api/product/delete", verifyToken, productController.deleteProduct);

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
