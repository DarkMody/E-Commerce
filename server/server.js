require("dotenv").config();
const pool = require("./config/db");
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const userController = require("./controllers/userController");
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
