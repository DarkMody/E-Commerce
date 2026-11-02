const pool = require("../config/db");
const asyncWrapper = require("../middlewares/asyncWrapper");
const httpStatusText = require("../utils/httpStatusText");
const appError = require("../utils/appError");

const employeeEditOrder = asyncWrapper(async (req, res, next) => {
  const { status } = req.body;

  const orderId = req.params.o_id;

  const order = await pool.query(`SELECT * FROM orders WHERE o_id = $1`, [
    orderId,
  ]);

  if (order.rows[0].status != "Shipped") {
    const error = appError.create(
      "You can't edit order.",
      401,
      httpStatusText.FAIL,
    );
    return next(error);
  }
  try {
    if (status == "Delivered") {
      await pool.query(`UPDATE orders SET status = $1 WHERE o_id = $2`, [
        status ?? order.rows[0].status,
        orderId,
      ]);
    } else {
      const error = appError.create(
        "You can just deliver order.",
        401,
        httpStatusText.FAIL,
      );
      return next(error);
    }
  } catch (err) {
    const error = appError.create(
      "Couldn't edit plz try again",
      500,
      httpStatusText.ERROR,
    );
    return next(error);
  }
  res.json({
    status: httpStatusText.SUCCESS,
    message: "Order has been edited successfully.",
  });
});

module.exports = {
  employeeEditOrder,
};
