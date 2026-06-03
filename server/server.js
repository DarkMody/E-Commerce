require("dotenv").config();
const pool = require("./DataBase/db");
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const userController = require("./controllers/userController");

app.use(cors());
app.use(express.json());
// Connecting DB & Server
pool.connect().then(() => {
  console.log("connected");
});
app.listen(port, () => {
  console.log(`Working on port ${port}`);
});

// User APIS
app.get("/api/users", userController.getAllUsers);
app.post("/api/users/register", userController.register);

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
