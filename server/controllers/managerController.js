const pool = require("../config/db");
const asyncWrapper = require("../middlewares/asyncWrapper");
const httpStatusText = require("../utils/httpStatusText");
const appError = require("../utils/appError");
const validations = require("../middlewares/validations");

const PROCESSING_DELAY_HOURS = 24;
const SHIPPED_DELAY_HOURS = 72;

const DATE_REGEX = validations.DATE_REGEX;

const fail = (next, message, code = 400) =>
  next(appError.create(message, code, httpStatusText.FAIL));
const round1 = (n) => Math.round(n * 10) / 10;
const round2 = (n) => Math.round(n * 100) / 100;

const getStats = asyncWrapper(async (req, res, next) => {
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 6 * 86400000);
  const start = req.query.start || weekAgo.toISOString().slice(0, 10);
  const end = req.query.end || today.toISOString().slice(0, 10);

  if (!DATE_REGEX.test(start) || !DATE_REGEX.test(end)) {
    return fail(next, "Dates must look like 2026-01-31.");
  }
  const days = (new Date(end) - new Date(start)) / 86400000 + 1;
  if (!(days >= 1))
    return fail(next, "The start date must be before the end date.");

  const range = [start, end];
  const PLACED = `created_at >= $1::date AND created_at < ($2::date + 1)`;
  const DELIVERED = `delivered_at >= $1::date AND delivered_at < ($2::date + 1)`;

  const [
    processing,
    oldestProcessing,
    shipped,
    longestShipped,
    couriers,
    stock,
    lowStock,
    byStatus,
    deliveredInRange,
    avgDelivery,
    daily,
  ] = await Promise.all([
    // ---------- right now ----------
    pool.query(
      `SELECT COUNT(*)::int AS count,
        COUNT(*) FILTER (WHERE created_at < NOW() - ($1 * interval '1 hour'))::int AS delayed
        FROM orders WHERE status = 'Processing'`,
      [PROCESSING_DELAY_HOURS],
    ),
    pool.query(
      `SELECT o_id, created_at,
        ROUND(EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600)::int AS hours_waiting
        FROM orders WHERE status = 'Processing' ORDER BY created_at ASC LIMIT 5`,
    ),
    pool.query(
      `SELECT COUNT(*)::int AS count,
        COUNT(*) FILTER (WHERE COALESCE(shipped_at, created_at) < NOW() - ($1 * interval '1 hour'))::int AS delayed
        FROM orders WHERE status = 'Shipped'`,
      [SHIPPED_DELAY_HOURS],
    ),
    pool.query(
      `SELECT o.o_id, c.name AS courier_name,
        ROUND(EXTRACT(EPOCH FROM (NOW() - COALESCE(o.shipped_at, o.created_at))) / 3600)::int AS hours_out
        FROM orders o LEFT JOIN users c ON c.u_id = o.courier_id
        WHERE o.status = 'Shipped'
        ORDER BY COALESCE(o.shipped_at, o.created_at) ASC LIMIT 5`,
    ),
    pool.query(
      `SELECT u.u_id, u.name,
        COUNT(o.o_id) FILTER (WHERE o.status = 'Shipped')::int AS active_orders
        FROM users u LEFT JOIN orders o ON o.courier_id = u.u_id
        WHERE u.role = 'employee'
        GROUP BY u.u_id ORDER BY active_orders DESC, u.name LIMIT 5`,
    ),
    pool.query(
      `SELECT COUNT(*) FILTER (WHERE quantity = 0)::int AS out_of_stock,
        COUNT(*) FILTER (WHERE quantity BETWEEN 1 AND 5)::int AS low
        FROM products`,
    ),
    pool.query(
      `SELECT p_id, name, quantity FROM products
        WHERE quantity <= 5 ORDER BY quantity ASC, name LIMIT 5`,
    ),
    // ---------- activity in the date range ----------
    pool.query(
      `SELECT status, COUNT(*)::int AS count FROM orders WHERE ${PLACED} GROUP BY status`,
      range,
    ),
    pool.query(
      `SELECT COUNT(*)::int AS count FROM orders WHERE ${DELIVERED}`,
      range,
    ),
    pool.query(
      `SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (delivered_at - created_at)) / 3600), 0)::float AS hours
        FROM orders WHERE status = 'Delivered' AND ${DELIVERED}`,
      range,
    ),
    pool.query(
      `SELECT to_char(d, 'YYYY-MM-DD') AS day,
        (SELECT COUNT(*) FROM orders o
          WHERE o.created_at >= d AND o.created_at < d + interval '1 day')::int AS placed,
        (SELECT COUNT(*) FROM orders o
          WHERE o.delivered_at >= d AND o.delivered_at < d + interval '1 day')::int AS delivered
          FROM generate_series($1::date, $2::date, interval '1 day') AS d
          ORDER BY d`,
      range,
    ),
  ]);

  const statusCounts = {
    Processing: 0,
    Shipped: 0,
    Delivered: 0,
    Cancelled: 0,
  };
  let ordersCount = 0;
  byStatus.rows.forEach((r) => {
    statusCounts[r.status] = r.count;
    ordersCount += r.count;
  });

  return res.json({
    status: httpStatusText.SUCCESS,
    data: {
      range: { start, end },
      delayRules: {
        processingHours: PROCESSING_DELAY_HOURS,
        shippedHours: SHIPPED_DELAY_HOURS,
      },
      // right now
      attention: {
        processingCount: processing.rows[0].count,
        delayedProcessing: processing.rows[0].delayed,
        oldestProcessing: oldestProcessing.rows,
        shippedCount: shipped.rows[0].count,
        delayedShipped: shipped.rows[0].delayed,
        longestShipped: longestShipped.rows,
        couriers: couriers.rows,
        outOfStock: stock.rows[0].out_of_stock,
        lowStock: stock.rows[0].low,
        lowStockProducts: lowStock.rows,
      },
      ordersCount,
      deliveredCount: deliveredInRange.rows[0].count,
      cancelledCount: statusCounts.Cancelled,
      cancellationRate: ordersCount
        ? round2((statusCounts.Cancelled / ordersCount) * 100)
        : 0,
      averageDeliveryHours: round1(avgDelivery.rows[0].hours),
      statusCounts,
      daily: daily.rows,
    },
  });
});

const getCouriers = asyncWrapper(async (req, res, next) => {
  const [couriers, active] = await Promise.all([
    pool.query(
      `SELECT u.u_id, u.name, u.email,
        COUNT(o.o_id) FILTER (WHERE o.status = 'Delivered'
        AND o.delivered_at >= date_trunc('day', NOW()))::int AS delivered_today
        FROM users u LEFT JOIN orders o ON o.courier_id = u.u_id
        WHERE u.role = 'employee'
        GROUP BY u.u_id ORDER BY u.name`,
    ),
    pool.query(
      `SELECT o.o_id, o.courier_id, o.location, o.phone_number,
        COALESCE(u.name, 'Deleted account') AS customer_name,
        ROUND(EXTRACT(EPOCH FROM (NOW() - COALESCE(o.shipped_at, o.created_at))) / 3600)::int AS hours_out
        FROM orders o LEFT JOIN users u ON u.u_id = o.user_id
        WHERE o.status = 'Shipped' AND o.courier_id IS NOT NULL
        ORDER BY COALESCE(o.shipped_at, o.created_at) ASC`,
    ),
  ]);

  const data = couriers.rows.map((c) => {
    const orders = active.rows.filter((o) => o.courier_id === c.u_id);
    return { ...c, active_orders: orders.length, orders };
  });
  // busiest first
  data.sort(
    (a, b) => b.active_orders - a.active_orders || a.name.localeCompare(b.name),
  );

  return res.json({ status: httpStatusText.SUCCESS, data });
});

module.exports = { getStats, getCouriers };
