const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const asyncWrapper = require("../middlewares/asyncWrapper");
const httpStatusText = require("../utils/httpStatusText");
const appError = require("../utils/appError");
const generateToken = require("../utils/generateToken");

const LOW_STOCK = 5;
const MAX_RANGE_DAYS = 366;
const ORDER_STATUSES = ["Processing", "Shipped", "Delivered", "Cancelled"];

const fail = (next, message, code = 400) =>
  next(appError.create(message, code, httpStatusText.FAIL));
const toPage = (value) => Math.max(1, parseInt(value, 10) || 1);
const round2 = (n) => Math.round(n * 100) / 100;

// What the customer paid for one line (the saved price, or the product's price for old rows)
const LINE_PRICE = "ROUND(p.price * (1 - COALESCE(op.discount, p.discount, 0)::numeric / 100), 2)";

const registerSeller = asyncWrapper(async (req, res, next) => {
  const { name, email, password, store_name, store_location } = req.body;
  const validate = await pool.query("select * from users where email = $1", [
    email,
  ]);
  if (validate.rows.length === 0) {
    const query =
      "INSERT INTO users (name ,email ,password ,role) values($1 ,$2 ,$3 ,$4) RETURNING *";
    const sellerQuery =
      "INSERT INTO sellers (user_id ,store_name ,store_location) values($1 ,$2 ,$3) RETURNING *";

    const hashed = await bcrypt.hash(password, 10);
    // Wrap both inserts in a transaction
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query(query, [name, email, hashed, "seller"]);
      const row = result.rows[0];
      await client.query(sellerQuery, [row.u_id, store_name, store_location]);
      await client.query("COMMIT");
      await generateToken(row, res);
      return res.status(201).json({
        status: httpStatusText.SUCCESS,
        data: {
          id: row.u_id,
          name: row.name,
          email: row.email,
          role: row.role,
          created_at: row.created_at,
          image: row.image,
        },
      });
    } catch (err) {
      await client.query("ROLLBACK");
      return next(err);
    } finally {
      client.release();
    }
  }
  return fail(next, "Email Already Exists", 409);
});

const getStats = asyncWrapper(async (req, res, next) => {
  const sellerId = req.currentUser.id;
  const today = new Date();
  const start =
    req.query.start ||
    new Date(today.getTime() - 29 * 86400000).toISOString().slice(0, 10);
  const end = req.query.end || today.toISOString().slice(0, 10);

  const days = (new Date(end) - new Date(start)) / 86400000 + 1;
  if (!(days >= 1))
    return fail(next, "The start date must be before the end date.");
  if (days > MAX_RANGE_DAYS)
    return fail(next, "Choose a range of up to one year.");

  // $1 = seller, $2 = start, $3 = end. The whole last day is included.
  const params = [sellerId, start, end];
  const IN_RANGE = `o.created_at >= $2::date AND o.created_at < ($3::date + 1)`;
  const SOLD = `o.status <> 'Cancelled' AND ${IN_RANGE}`;

  const [byStatus, daily, perProduct] = await Promise.all([
    pool.query(
      `SELECT o.status,
              COUNT(DISTINCT o.o_id)::int AS orders,
              COALESCE(SUM(op.quantity), 0)::int AS units,
              COALESCE(SUM(op.quantity * ${LINE_PRICE}), 0)::float AS revenue
        FROM orders o
        JOIN order_product op ON op.order_id = o.o_id
        JOIN products p ON p.p_id = op.product_id
        WHERE p.seller_id = $1 AND ${IN_RANGE}
        GROUP BY o.status`,
      params,
    ),
    pool.query(
      `SELECT to_char(d, 'YYYY-MM-DD') AS day,
              COALESCE(SUM(x.units), 0)::int AS units,
              COALESCE(SUM(x.revenue), 0)::float AS revenue
        FROM generate_series($2::date, $3::date, interval '1 day') AS d
        LEFT JOIN (
         SELECT o.created_at, op.quantity AS units, op.quantity * ${LINE_PRICE} AS revenue
          FROM orders o
          JOIN order_product op ON op.order_id = o.o_id
          JOIN products p ON p.p_id = op.product_id
          WHERE p.seller_id = $1 AND ${SOLD}
        ) x ON x.created_at >= d AND x.created_at < d + interval '1 day'
        GROUP BY d ORDER BY d`,
      params,
    ),
    // every product of this seller, with what it sold in the range
    pool.query(
      `SELECT p.p_id, p.name, p.quantity AS stock,
              COALESCE(SUM(op.quantity) FILTER (WHERE ${SOLD}), 0)::int AS units,
              COALESCE(SUM(op.quantity * ${LINE_PRICE}) FILTER (WHERE ${SOLD}), 0)::float AS revenue
        FROM products p
        LEFT JOIN order_product op ON op.product_id = p.p_id
        LEFT JOIN orders o ON o.o_id = op.order_id
        WHERE p.seller_id = $1
        GROUP BY p.p_id ORDER BY units DESC, revenue DESC, p.name`,
      params,
    ),
  ]);

  // numbers from the per-status rows
  const statusCounts = {
    Processing: 0,
    Shipped: 0,
    Delivered: 0,
    Cancelled: 0,
  };
  let ordersCount = 0,
    revenue = 0,
    earned = 0,
    unitsSold = 0;
  byStatus.rows.forEach((r) => {
    statusCounts[r.status] = r.orders;
    ordersCount += r.orders;
    if (r.status !== "Cancelled") {
      revenue += r.revenue;
      unitsSold += r.units;
    }
    if (r.status === "Delivered") earned += r.revenue;
  });

  // numbers from the product rows
  const all = perProduct.rows;
  const sold = all.filter((p) => p.units > 0);
  const noSales = all.filter((p) => p.units === 0);
  const lowest = all
    .filter((p) => p.stock <= LOW_STOCK)
    .sort((a, b) => a.stock - b.stock || a.name.localeCompare(b.name));

  return res.json({
    status: httpStatusText.SUCCESS,
    data: {
      range: { start, end },
      productCount: all.length,
      // for the date range
      revenue: round2(revenue), // everything except cancelled orders
      earned: round2(earned), // delivered orders only
      unitsSold,
      ordersCount, // orders that contain your products
      cancellationRate: ordersCount
        ? round2((statusCounts.Cancelled / ordersCount) * 100)
        : 0,
      statusCounts,
      daily: daily.rows, // [{ day, units, revenue }]
      topProducts: sold.slice(0, 10), // [{ p_id, name, stock, units, revenue }]
      noSales: { count: noSales.length, products: noSales.slice(0, 10) },
      // right now
      stock: {
        outOfStock: all.filter((p) => p.stock === 0).length,
        low: all.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK).length,
        products: lowest
          .slice(0, 10)
          .map((p) => ({ p_id: p.p_id, name: p.name, quantity: p.stock })),
      },
      // old names, in case something still reads them
      salesTotal: round2(revenue),
      productsSold: unitsSold,
    },
  });
});

/* =====================================================================
   GET /api/seller/orders?page=&search=&status=
   The orders that contain this seller's products, with ONLY their lines and subtotal.
   No customer details (name, phone, address).
   ===================================================================== */
const getOrders = asyncWrapper(async (req, res, next) => {
  const sellerId = req.currentUser.id;
  const page = toPage(req.query.page);
  const pageSize = 12;
  const rawSearch = String(req.query.search ?? "").trim();
  const digits = rawSearch.replace(/\D/g, "");
  const wanted = String(req.query.status ?? "").toLowerCase();
  const status = ORDER_STATUSES.find((s) => s.toLowerCase() === wanted) ?? "";

  if (rawSearch && !digits) {
    return res.json({
      status: httpStatusText.SUCCESS,
      data: [],
      pagination: { page, totalPages: 1, totalItems: 0 },
    });
  }

  const filters = `p.seller_id = $1
    AND ($2::text = '' OR CAST(o.o_id AS TEXT) LIKE $3::text)
    AND ($4::text = '' OR o.status = $4::text)`;
  const values = [sellerId, digits, `%${digits}%`, status];

  const [list, count] = await Promise.all([
    pool.query(
      `SELECT o.o_id, o.created_at, o.status,
              SUM(op.quantity)::int AS units,
              SUM(op.quantity * ${LINE_PRICE})::float AS subtotal,
              json_agg(json_build_object(
                'p_id', p.p_id, 'name', p.name, 'quantity', op.quantity, 'price', ${LINE_PRICE}
              ) ORDER BY p.name) AS items
       FROM orders o
       JOIN order_product op ON op.order_id = o.o_id
       JOIN products p ON p.p_id = op.product_id
       WHERE ${filters}
       GROUP BY o.o_id
       ORDER BY o.created_at DESC, o.o_id DESC
       LIMIT $5 OFFSET $6`,
      [...values, pageSize, (page - 1) * pageSize],
    ),
    pool.query(
      `SELECT COUNT(DISTINCT o.o_id)::int AS total
       FROM orders o
       JOIN order_product op ON op.order_id = o.o_id
       JOIN products p ON p.p_id = op.product_id
       WHERE ${filters}`,
      values,
    ),
  ]);

  const total = count.rows[0].total;
  return res.json({
    status: httpStatusText.SUCCESS,
    data: list.rows,
    pagination: {
      page,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      totalItems: total,
    },
  });
});

module.exports = { registerSeller, getStats, getOrders };
