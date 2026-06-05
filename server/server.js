require("dotenv").config();
const pool = require("./config/db");
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const userController = require("./controllers/userController");
const createTables = require("./data/createTables");

app.use(cors());
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
app.get("/api/user", userController.getAllUsers);
app.post("/api/register/user", userController.registerUser);
app.post("/api/register/seller", userController.registerSeller);
app.post("/api/login", userController.login);

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
