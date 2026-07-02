const pool = require("../config/db");
const asyncWrapper = require("../middlewares/asyncWrapper");
const httpStatusText = require("../utils/httpStatusText");
const appError = require("../utils/appError");

const getAllProducts = asyncWrapper(async (req, res, next) => {
  const result = await pool.query(`SELECT * FROM products`);
  res.json({ status: httpStatusText.SUCCESS, data: result.rows });
});

const getSellerProducts = asyncWrapper(async (req, res, next) => {
  const seller_id = req.currentUser.id;
  const result = await pool.query(
    `SELECT * FROM products WHERE seller_id = $1`,
    seller_id,
  );
  res.json({ status: httpStatusText.SUCCESS, data: result.rows });
});

const getProduct = asyncWrapper(async (req, res, next) => {
  const result = await pool.query(`SELECT * FROM products where p_id = $1`, [
    req.params.p_id,
  ]);
  res.json({ status: httpStatusText.SUCCESS, data: result.rows[0] });
});

const addProduct = asyncWrapper(async (req, res, next) => {
  const seller_id = req.currentUser.id;
  console.log(req.currentUser);
  const { name, description, price, quantity } = req.body;
  if (!req.files || req.files.length === 0) {
    const error = appError.create(
      "At least one image is required",
      400,
      httpStatusText.FAIL,
    );
    return next(error);
  }
  const query = `INSERT INTO products (name, description, price, quantity, seller_id)
  VALUES ($1, $2, $3, $4, $5) RETURNING *`;
  const result = await pool.query(query, [
    name,
    description,
    price,
    quantity,
    seller_id,
  ]);
  const p_id = result.rows[0].p_id;
  // const imageUrls = [];
  const insertPromises = req.files.map((file, index) => {
    const imageUrl = `/uploads/${file.filename}`;
    return pool.query(
      `INSERT INTO images (product_id, image, sort_order) VALUES ($1, $2, $3)`,
      [p_id, imageUrl, index],
    );
  });
  await Promise.all(insertPromises);

  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "Product has been added successfully",
  });
});

const deleteProduct = asyncWrapper(async (req, res, next) => {
  const result = await pool.query(`SELECT * FROM products where p_id = $1`, [
    req.params.p_id,
  ]);
  if (
    req.currentUser.id == result.rows[0].seller_id ||
    req.currentUser.role == "admin"
  ) {
    await pool.query(`DELETE FROM products WHERE p_id = 1$`, [req.params.p_id]);
    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: "Product has been deleted successfully",
    });
  }
  const error = appError.create(
    "You are not this product's owner",
    401,
    httpStatusText.FAIL,
  );
  next(error);
});

module.exports = {
  getAllProducts,
  getSellerProducts,
  getProduct,
  addProduct,
  deleteProduct,
};
