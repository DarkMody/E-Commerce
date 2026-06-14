const pool = require("../config/db");
const asyncWrapper = require("../middlewares/asyncWrapper");
const httpStatusText = require("../utils/httpStatusText");
const appError = require("../utils/appError");

const getAllProducts = asyncWrapper(async (req, res, next) => {
  const result = await pool.query(`SELECT * FROM products`);
  res.json({ status: httpStatusText.SUCCESS, data: result.rows });
});

const getProduct = asyncWrapper(async (req, res, next) => {
  const result = await pool.query(`SELECT * FROM products where p_id = $1`, [
    req.params.p_id,
  ]);
  res.json({ status: httpStatusText.SUCCESS, data: result.rows[0] });
});

const addProduct = asyncWrapper(async (req, res, next) => {
  const seller_id = req.currentUser.u_id;
  const { name, description, price, quantity } = req.body;
  const query = `INSERT INTO products (name, description, price, quantity, seller_id)
  VALUES ($1, $2, $3, $4, $5)`;
  await pool.query(query, [name, description, price, quantity, seller_id]);
  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "Product has been added successfully",
  });
});

const deleteProduct = asyncWrapper(async (req, res, next) => {
  const result = await pool.query(`SELECT * FROM products where p_id = $1`, [
    req.params.p_id,
  ]);
  if (req.currentUser.u_id == result.rows[0].seller_id) {
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
