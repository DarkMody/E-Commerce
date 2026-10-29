const pool = require("../config/db");
const asyncWrapper = require("../middlewares/asyncWrapper");
const httpStatusText = require("../utils/httpStatusText");
const appError = require("../utils/appError");
const generateToken = require("../utils/generateToken");

const getStats = asyncWrapper(async (req, res, next) => {
  const result = await pool.query(
    `SELECT
      COUNT(*) FILTER (WHERE status = 'Processing') AS processing_orders,
      COUNT(*) FILTER (WHERE status = 'Shipped') AS shipped_orders,
      COUNT(*) FILTER (WHERE status = 'Delivered') AS delivered_orders,
      COUNT(*) FILTER (WHERE status = 'Cancelled') AS cancelled_orders,
      COUNT(*) AS total_orders
    FROM orders;`,
  );
  res.json({
    status: httpStatusText.SUCCESS,
    data: {
      ordersCount: result.rows[0].total_orders,
      deliveredCount: result.rows[0].delivered_orders,
      cancelledCount: result.rows[0].cancelled_orders,
      pendingShipments: result.rows[0].processing_orders,
    },
  });
});

module.exports = {
  getStats,
};
