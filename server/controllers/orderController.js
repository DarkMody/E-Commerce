const pool = require("../config/db");
const asyncWrapper = require("../middlewares/asyncWrapper");
const httpStatusText = require("../utils/httpStatusText");
const appError = require("../utils/appError");

const getOrders = asyncWrapper(async (req, res, next) => {
  const result = await pool.query(`SELECT * FROM orders WHERE user_id = $1`, [
    req.currentUser.id,
  ]);
  return res.json({ status: httpStatusText.SUCCESS, data: result.rows });
});

const makeOrder = asyncWrapper(async (req, res, next) => {
  const { location, phoneNumber, method } = req.body;
  // /^(?:\+20|0)1[0125]\d{8}$/
  const userId = req.currentUser.id;
  const totalPrice = await pool.query(
    `SELECT  sum(c.quantity * p.price) as total_price FROM cart as c
    INNER JOIN products as p ON p.p_id = c.product_id
    WHERE c.user_id = $1`,
    [userId],
  );
  if (!totalPrice.rows[0].total_price) {
    const error = appError.create(
      "No products to ship plz put what you need",
      400,
      httpStatusText.FAIL,
    );
    return next(error);
  }
  const order = await pool.query(
    `INSERT INTO orders(user_id, location, phone_number, method, total_price)
    VALUES($1, $2, $3, $4, $5) RETURNING *`,
    [userId, location, phoneNumber, method, totalPrice.rows[0].total_price],
  );
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

const editOrder = asyncWrapper(async (req, res, next) => {
  const { location, phoneNumber, status } = req.body;
  const orderId = req.params.o_id;
  const order = await pool.query(`SELECT * FROM orders WHERE o_id = $1`, [
    orderId,
  ]);
  if (order.rows[0].user_id == req.currentUser.id) {
    if (
      order.rows[0].status == "Cancelled" ||
      order.rows[0].status == "Delivered"
    ) {
      const error = appError.create(
        "Can't edit order anymore",
        401,
        httpStatusText.ERROR,
      );
      return next(error);
    }

    if ((location || status) && order.rows[0].status != "Processing") {
      const error = appError.create(
        "You can't change location or cancel order your order on the way",
        400,
        httpStatusText.FAIL,
      );
      return next(error);
    }

    try {
      if (status == "Cancelled") {
        const products = await pool.query(
          `SELECT * FROM order_product WHERE order_id = $1`,
          [orderId],
        );
        const changeStock = products.rows.map((product) =>
          pool.query(
            `UPDATE products SET quantity = quantity + $1, sold = sold - $1 WHERE p_id = $2`,
            [product.quantity, product.product_id],
          ),
        );
        await Promise.all(changeStock);
      }
      await pool.query(
        `UPDATE orders SET location = $1, phone_number = $2, status = $3 WHERE o_id = $4`,
        [
          location ?? order.rows[0].location,
          phoneNumber ?? order.rows[0].phone_number,
          status ?? order.rows[0].status,
          orderId,
        ],
      );
    } catch (err) {
      const error = appError.create(
        "Couldn't edit plz try again",
        500,
        httpStatusText.ERROR,
      );
      return next(error);
    }
  } else if (
    req.currentUser.role != "user" &&
    req.currentUser.role != "seller"
  ) {
    await pool.query(`UPDATE orders SET status = $1 WHERE o_id = $2`, [
      status ?? order.rows[0].status,
      orderId,
    ]);
  } else {
    const error = appError.create(
      "You don't have access to edit product",
      401,
      httpStatusText.FAIL,
    );
    return next(error);
  }
  res.json({
    status: httpStatusText.SUCCESS,
    message: "Order has been edited successfully",
  });
});

const getOrderProduct = asyncWrapper(async (req, res, next) => {
  const order = await pool.query(`SELECT * FROM orders WHERE o_id = $1`, [
    req.params.o_id,
  ]);
  if (
    order.rows[0].user_id == req.currentUser.id ||
    req.currentUser.role == "admin"
  ) {
    const result = await pool.query(
      `SELECT p.*, op.quantity AS ordered_quantity, i.image FROM products as p
      JOIN order_product as op ON p.p_id = op.product_id
      JOIN orders as o ON o.o_id = op.order_id
      JOIN images as i ON i.product_id = p.p_id
      WHERE op.order_id = $1 AND i.sort_order = 0`,
      [req.params.o_id],
    );
    return res.json({ status: httpStatusText.SUCCESS, data: result.rows });
  }
  const error = appError.create(
    "you don't have the right to access this order's products",
    401,
    httpStatusText.ERROR,
  );
  return next(error);
});

module.exports = {
  getOrders,
  makeOrder,
  editOrder,
  getOrderProduct,
};
