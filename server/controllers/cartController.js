const pool = require("../config/db");
const asyncWrapper = require("../middlewares/asyncWrapper");
const httpStatusText = require("../utils/httpStatusText");
const appError = require("../utils/appError");

const getCart = asyncWrapper(async (req, res, next) => {
  const result = await pool.query(
    `SELECT DISTINCT p.*, i.image, ct.quantity FROM products as p
    LEFT JOIN cart as ct on ct.product_id = p.p_id
    LEFT JOIN images as i on i.product_id = p.p_id
    WHERE i.sort_order = 0 AND ct.user_id = $1`,
    [req.currentUser.id],
  );
  res.json({ status: httpStatusText.SUCCESS, data: result.rows });
});

const isInCart = asyncWrapper(async (req, res, next) => {
  const result = await pool.query(
    `SELECT * FROM cart WHERE user_id = $1 AND product_id = $2`,
    [req.currentUser.id, req.params.p_id],
  );
  res.json({ status: httpStatusText.SUCCESS, data: result.rows });
});

const addToCart = asyncWrapper(async (req, res, next) => {
  const [userId, productId] = [req.currentUser.id, req.params.p_id];
  const product = await pool.query(`SELECT * FROM products WHERE p_id = $1`, [
    productId,
  ]);
  if (product.rows.length === 0) {
    const error = appError.create(
      "Product isn't here",
      401,
      httpStatusText.FAIL,
    );
    return next(error);
  }
  if (product.rows[0].seller_id == userId) {
    const error = appError.create(
      "You can't add your own product",
      401,
      httpStatusText.FAIL,
    );
    return next(error);
  }

  const check = await pool.query(
    `SELECT * FROM cart WHERE product_id = $1 AND user_id = $2`,
    [productId, userId],
  );
  if (check.rows.length != 0) {
    const error = appError.create(
      "The product is in your cart",
      401,
      httpStatusText.FAIL,
    );
    return next(error);
  }

  if (product.rows[0].quantity <= 0) {
    const error = appError.create(
      "Sorry the product is out of stock",
      401,
      httpStatusText.FAIL,
    );
    return next(error);
  }
  await pool.query(`INSERT INTO cart (user_id, product_id) VALUES ($1, $2)`, [
    userId,
    productId,
  ]);
  res.json({
    status: httpStatusText.SUCCESS,
    message: "Product has been added to your cart",
  });
});

const deleteFromCart = asyncWrapper(async (req, res, next) => {
  const [userId, productId] = [req.currentUser.id, req.params.p_id];
  await pool.query(`DELETE FROM cart WHERE user_id = $1 AND product_id = $2`, [
    userId,
    productId,
  ]);
  res.json({
    status: httpStatusText.SUCCESS,
    message: "Product has been deleted from your cart",
  });
});

const editCart = asyncWrapper(async (req, res, next) => {
  const [userId, productId, quantity] = [
    req.currentUser.id,
    req.params.p_id,
    req.body.quantity,
  ];
  if (quantity <= 0) {
    const error = appError.create(
      "Quantity must be bigger than 0",
      401,
      httpStatusText.FAIL,
    );
    return next(error);
  }

  const check = await pool.query(
    `SELECT * FROM cart WHERE product_id = $1 AND user_id = $2`,
    [productId, userId],
  );
  if (check.rows.length == 0) {
    const error = appError.create(
      "Product not in cart",
      401,
      httpStatusText.FAIL,
    );
    return next(error);
  }

  const product = await pool.query(`SELECT * FROM products WHERE p_id = $1`, [
    productId,
  ]);
  if (product.rows.length === 0) {
    const error = appError.create(
      "Product isn't here",
      401,
      httpStatusText.FAIL,
    );
    return next(error);
  }

  if (product.rows[0].quantity >= quantity) {
    pool.query(
      `UPDATE cart SET quantity = $1 WHERE product_id = $2 AND user_id = $3`,
      [quantity, productId, userId],
    );
    res.json({ status: httpStatusText.SUCCESS, message: "Edit done" });
  } else {
    const error = appError.create(
      `The stock is just ${product.rows[0].quantity}`,
      401,
      httpStatusText.ERROR,
    );
    return next(error);
  }
});

module.exports = { getCart, addToCart, deleteFromCart, editCart, isInCart };
