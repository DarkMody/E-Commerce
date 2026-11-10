const pool = require("../config/db");
const asyncWrapper = require("../middlewares/asyncWrapper");
const httpStatusText = require("../utils/httpStatusText");
const appError = require("../utils/appError");

const TAB_STATUSES = ["Shipped", "Delivered", "Cancelled"]; // to deliver / delivered / rejected
const PAGE_SIZE = 12;

const fail = (next, message, code = 400) =>
  next(appError.create(message, code, httpStatusText.FAIL));
const toPage = (value) => Math.max(1, parseInt(value, 10) || 1);

const getMyOrders = asyncWrapper(async (req, res, next) => {
  const courierId = req.currentUser.id;
  const page = toPage(req.query.page);
  const wanted = String(req.query.status ?? "Shipped").toLowerCase();
  const status = TAB_STATUSES.find((s) => s.toLowerCase() === wanted);
  if (!status) return fail(next, "Choose a valid status.");

  // to deliver: oldest first (deliver those first). The others: newest first.
  const orderBy =
    status === "Shipped"
      ? "COALESCE(o.shipped_at, o.created_at) ASC, o.o_id ASC"
      : "o.created_at DESC, o.o_id DESC";

  const [list, total, counts] = await Promise.all([
    pool.query(
      `SELECT o.o_id, o.created_at, o.shipped_at, o.delivered_at, o.status,
              o.total_price, o.method, o.phone_number, o.location,
              COALESCE(u.name, 'Deleted account') AS customer_name,
              (SELECT COALESCE(json_agg(json_build_object('name', p.name, 'quantity', op.quantity)
                                        ORDER BY p.name), '[]'::json)
               FROM order_product op JOIN products p ON p.p_id = op.product_id
               WHERE op.order_id = o.o_id) AS items
       FROM orders o
       LEFT JOIN users u ON u.u_id = o.user_id
       WHERE o.courier_id = $1 AND o.status = $2
       ORDER BY ${orderBy}
       LIMIT $3 OFFSET $4`,
      [courierId, status, PAGE_SIZE, (page - 1) * PAGE_SIZE],
    ),
    pool.query(
      `SELECT COUNT(*)::int AS total FROM orders WHERE courier_id = $1 AND status = $2`,
      [courierId, status],
    ),
    pool.query(
      `SELECT status, COUNT(*)::int AS count FROM orders
       WHERE courier_id = $1 GROUP BY status`,
      [courierId],
    ),
  ]);

  const tabCounts = { Shipped: 0, Delivered: 0, Cancelled: 0 };
  counts.rows.forEach((r) => {
    if (r.status in tabCounts) tabCounts[r.status] = r.count;
  });

  const totalItems = total.rows[0].total;
  return res.json({
    status: httpStatusText.SUCCESS,
    data: list.rows,
    counts: tabCounts,
    pagination: {
      page,
      totalPages: Math.max(1, Math.ceil(totalItems / PAGE_SIZE)),
      totalItems,
    },
  });
});

const updateMyOrder = asyncWrapper(async (req, res, next) => {
  const courierId = String(req.currentUser.id).toLowerCase();
  const orderId = Number(req.params.o_id);
  const { status } = req.body;

  if (status !== "Delivered" && status !== "Cancelled") {
    return fail(next, "You can mark an order as delivered or rejected.");
  }

  const client = await pool.connect();
  let problem = null; // [message, code]
  try {
    await client.query("BEGIN");
    const found = await client.query(
      `SELECT status, courier_id FROM orders WHERE o_id = $1 FOR UPDATE`,
      [orderId],
    );

    if (
      !found.rows.length ||
      String(found.rows[0].courier_id).toLowerCase() !== courierId
    ) {
      problem = ["Order not found.", 404]; // not his order: don't say that it exists
    } else if (found.rows[0].status !== "Shipped") {
      problem = ["This order is not on its way anymore.", 409];
    } else if (status === "Delivered") {
      await client.query(
        `UPDATE orders SET status = 'Delivered', delivered_at = NOW() WHERE o_id = $1`,
        [orderId],
      );
    } else {
      // rejected: give the products back to the stock
      await client.query(
        `UPDATE products p
         SET quantity = p.quantity + op.qty, sold = p.sold - op.qty
         FROM (SELECT product_id, SUM(quantity)::int AS qty
               FROM order_product WHERE order_id = $1 GROUP BY product_id) op
         WHERE p.p_id = op.product_id`,
        [orderId],
      );
      await client.query(
        `UPDATE orders SET status = 'Cancelled' WHERE o_id = $1`,
        [orderId],
      );
    }

    await client.query(problem ? "ROLLBACK" : "COMMIT");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    return next(
      appError.create(
        "Couldn't update the order, please try again",
        500,
        httpStatusText.ERROR,
      ),
    );
  } finally {
    client.release();
  }

  if (problem) return fail(next, problem[0], problem[1]);
  return res.json({
    status: httpStatusText.SUCCESS,
    message:
      status === "Delivered"
        ? "Order marked as delivered."
        : "Order rejected and cancelled.",
  });
});

module.exports = { getMyOrders, updateMyOrder };
