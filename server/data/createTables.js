const fs = require("fs");
const path = require("path");
const pool = require("../config/db");

const createTables = async () => {
  try {
    const usersSql = fs.readFileSync(path.join(__dirname, "users.sql"), "utf8");
    const sellersSql = fs.readFileSync(
      path.join(__dirname, "sellers.sql"),
      "utf8",
    );
    const productsSql = fs.readFileSync(
      path.join(__dirname, "product.sql"),
      "utf8",
    );
    const commentsSql = fs.readFileSync(
      path.join(__dirname, "comments.sql"),
      "utf8",
    );
    const categorySql = fs.readFileSync(
      path.join(__dirname, "category.sql"),
      "utf8",
    );
    const productCategorySql = fs.readFileSync(
      path.join(__dirname, "productCategory.sql"),
      "utf8",
    );

    await pool.query(usersSql);
    await pool.query(sellersSql);
    await pool.query(productsSql);
    await pool.query(commentsSql);
    await pool.query(categorySql);
    await pool.query(productCategorySql);
  } catch (error) {
    console.error("❌ Error initializing database tables:", error.message);
  }
};

module.exports = createTables;
