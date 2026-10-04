const pool = require("../config/db");
const asyncWrapper = require("../middlewares/asyncWrapper");
const httpStatusText = require("../utils/httpStatusText");
const appError = require("../utils/appError");

const getAllOrders = asyncWrapper(async (req, res, next) => {
  const result = await pool.query(`SELECT * FROM orders`);
  return res.json({ status: httpStatusText.SUCCESS, data: result.rows });
});

const getOrders = asyncWrapper(async (req, res, next) => {
  const result = await pool.query(`SELECT * FROM orders WHERE user_id = $1`, [
    req.currentUser.id,
  ]);
  return res.json({ status: httpStatusText.SUCCESS, data: result.rows });
});

const makeOrder = asyncWrapper(async (req, res, next) => {
  const { location, phoneNumber, method } = req.body;
  console.log(location, phoneNumber, method);
  const userId = req.currentUser.id;
  const totalPrice = await pool.query(
    `SELECT  sum(c.quantity * p.price) as total_price FROM cart as c
    INNER JOIN products as p ON p.p_id = c.product_id
    WHERE c.user_id = $1`,
    [userId],
  );
  const order = await pool.query(
    `INSERT INTO orders(user_id, location, phone_number, method, total_price)
    VALUES($1, $2, $3, $4, $5) RETURNING *`,
    [userId, location, phoneNumber, method, totalPrice.rows[0].total_price],
  );
  console.log(order);
  try {
    const products = await pool.query(`SELECT * FROM cart WHERE user_id = $1`, [
      userId,
    ]);
    const insertOrderedProducts = products.rows.map((product) =>
      pool.query(
        `INSERT INTO order_product(order_id, product_id, quantity) VALUES($1, $2, $3)`,
        [order.rows[0].o_id, product.product_id, product.quantity],
      ),
    );
    const changeStock = products.rows.map((product) =>
      pool.query(
        `UPDATE products SET quantity = quantity - $1, sold = sold + $1 WHERE p_id = $2`,
        [product.quantity, product.product_id],
      ),
    );
    await Promise.all(insertOrderedProducts);
    await Promise.all(changeStock);
    await pool.query(`DELETE FROM cart WHERE user_id = $1`, [userId]);
  } catch (err) {
    await pool.query(`DELETE FROM order WHERE o_id = $1`, [order.rows[0].o_id]);
    await pool.query(`DELETE FROM order_product WHERE o_id = $1`, [
      order.rows[0].o_id,
    ]);
    const error = appError.create(
      "Couldn't place order plz retry",
      500,
      httpStatusText.ERROR,
    );
    return next(error);
  }
  return res.json({
    status: httpStatusText.SUCCESS,
    message: "Order has been placed successfully",
  });
});

module.exports = {
  getAllOrders,
  getOrders,
  makeOrder,
};
