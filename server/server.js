require("dotenv").config();
const pool = require("./config/db");
const express = require("express");
const cors = require("cors");
const app = express();
const path = require("path");
const port = process.env.PORT || 5000;
const createTables = require("./data/createTables");
const cookieParser = require("cookie-parser");

app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FrontURL, // your frontend URL
    credentials: true, // allows cookies to be sent cross-origin
  }),
);

// For handling images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.json());

// Connecting DB & Server & Tables
pool.connect().then(() => {
  console.log("connected");
  createTables();
});
app.listen(port, "0.0.0.0", () => {
  console.log(`Working on port ${port}`);
});

// Routes
app.use("/api", require("./router/router"));

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
