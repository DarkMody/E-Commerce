const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const asyncWrapper = require("../middlewares/asyncWrapper");
const httpStatusText = require("../utils/httpStatusText");
const appError = require("../utils/appError");
const generateToken = require("../utils/generateToken");
const { deleteFromCloudinary } = require("../utils/image");

const ROLES = ["customer", "seller", "admin", "manager", "employee"];
const ORDER_STATUSES = ["Processing", "Shipped", "Delivered", "Cancelled"];

const fail = (next, message, code = 400) =>
  next(appError.create(message, code, httpStatusText.FAIL));
const toPage = (value) => Math.max(1, parseInt(value, 10) || 1);
const round2 = (n) => Math.round(n * 100) / 100;
// Escape % and _ so a search like "50%" doesn't act as a wildcard
const likePattern = (text) => `%${String(text).replace(/[\\%_]/g, "\\$&")}%`;
const currentUserId = (req) => req.currentUser?.id;

// Temporary
const registerAdmin = asyncWrapper(async (req, res, next) => {
  const { name, email, password } = req.body;
  const validate = await pool.query("select * from users where email = $1", [
    email,
  ]);
  if (validate.rows.length === 0) {
    const query =
      "INSERT INTO users (name,email,password,role) values($1 ,$2 ,$3 ,'admin') RETURNING *";
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(query, [name, email, hashed]);
    const row = result.rows[0];
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
  }
  return fail(next, "Email Already Exists", 409);
});

const getStatus = asyncWrapper(async (req, res, next) => {
  const start = req.query.start || "2020-01-01";
  const end = req.query.end || new Date().toISOString().slice(0, 10);
  const days = (new Date(end) - new Date(start)) / 86400000 + 1;
  if (!(days >= 1))
    return fail(next, "The start date must be before the end date.");

  const p = [start, end];
  const RANGE = `created_at >= $1::date AND created_at < ($2::date + 1)`;
  const ORANGE = `o.created_at >= $1::date AND o.created_at < ($2::date + 1)`;

  const [
    byStatus,
    newUsers,
    daily,
    topProducts,
    methods,
    waiting,
    oldest,
    stock,
    lowStock,
    roles,
  ] = await Promise.all([
    pool.query(
      `SELECT status, COUNT(*)::int AS count, COALESCE(SUM(total_price), 0)::float AS total
       FROM orders WHERE ${RANGE} GROUP BY status`,
      p,
    ),
    pool.query(`SELECT COUNT(*)::int AS count FROM users WHERE ${RANGE}`, p),
    pool.query(
      `SELECT to_char(d, 'YYYY-MM-DD') AS day,
              COUNT(o.o_id)::int AS orders,
              COALESCE(SUM(o.total_price) FILTER (WHERE o.status <> 'Cancelled'), 0)::float AS sales
       FROM generate_series($1::date, $2::date, interval '1 day') AS d
       LEFT JOIN orders o ON o.created_at >= d AND o.created_at < d + interval '1 day'
       GROUP BY d ORDER BY d`,
      p,
    ),
    pool.query(
      `SELECT p.p_id, p.name, SUM(op.quantity)::int AS units
       FROM order_product op
       JOIN orders o ON o.o_id = op.order_id
       JOIN products p ON p.p_id = op.product_id
       WHERE o.status <> 'Cancelled' AND ${ORANGE}
       GROUP BY p.p_id, p.name ORDER BY units DESC, p.name LIMIT 5`,
      p,
    ),
    pool.query(
      `SELECT method, COUNT(*)::int AS count FROM orders WHERE ${RANGE} GROUP BY method`,
      p,
    ),
    pool.query(
      `SELECT COUNT(*)::int AS count FROM orders WHERE status = 'Processing'`,
    ),
    pool.query(
      `SELECT o_id, created_at, total_price::float AS total_price
       FROM orders WHERE status = 'Processing' ORDER BY created_at ASC LIMIT 5`,
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
    pool.query(
      `SELECT role, COUNT(*)::int AS count FROM users GROUP BY role ORDER BY count DESC`,
    ),
  ]);

  // totals from the per-status rows
  const statusCounts = {
    Processing: 0,
    Shipped: 0,
    Delivered: 0,
    Cancelled: 0,
  };
  let ordersCount = 0,
    sales = 0,
    billable = 0,
    deliveredRevenue = 0;
  byStatus.rows.forEach((r) => {
    statusCounts[r.status] = r.count;
    ordersCount += r.count;
    if (r.status !== "Cancelled") {
      sales += r.total;
      billable += r.count;
    }
    if (r.status === "Delivered") deliveredRevenue += r.total;
  });

  return res.json({
    status: httpStatusText.SUCCESS,
    data: {
      range: { start, end },
      // numbers for the date range
      ordersCount,
      usersCount: newUsers.rows[0].count,
      salesTotal: round2(sales),
      deliveredRevenue: round2(deliveredRevenue),
      averageOrderValue: billable ? round2(sales / billable) : 0,
      cancellationRate: ordersCount
        ? round2((statusCounts.Cancelled / ordersCount) * 100)
        : 0,
      statusCounts,
      daily: daily.rows, // [{ day, orders, sales }] one row per day
      topProducts: topProducts.rows, // [{ p_id, name, units }]
      paymentMethods: methods.rows, // [{ method, count }]
      // right now
      attention: {
        processingCount: waiting.rows[0].count,
        oldestProcessing: oldest.rows, // [{ o_id, created_at, total_price }]
        outOfStock: stock.rows[0].out_of_stock,
        lowStock: stock.rows[0].low,
        lowStockProducts: lowStock.rows, // [{ p_id, name, quantity }]
      },
      usersByRole: roles.rows, // [{ role, count }]
    },
  });
});

const getAllUsers = asyncWrapper(async (req, res, next) => {
  const page = toPage(req.query.page);
  const pageSize = 20;
  const like = likePattern(String(req.query.search ?? "").trim());

  const [list, count] = await Promise.all([
    pool.query(
      `SELECT u_id, name, email, role, created_at FROM users
        WHERE email ILIKE $1 ORDER BY created_at DESC, u_id LIMIT $2 OFFSET $3`,
      [like, pageSize, (page - 1) * pageSize],
    ),
    pool.query(
      `SELECT COUNT(*)::int AS total FROM users WHERE email ILIKE $1`,
      [like],
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

const getAllOrders = asyncWrapper(async (req, res, next) => {
  const page = toPage(req.query.page);
  const pageSize = 6;
  const digits = String(req.query.search ?? "").replace(/\D/g, "");
  const wanted = String(req.query.status ?? "").toLowerCase();
  const status = ORDER_STATUSES.find((s) => s.toLowerCase() === wanted) ?? "";

  // searched for something that has no digits -> nothing can match
  if (String(req.query.search ?? "").trim() && !digits) {
    return res.json({
      status: httpStatusText.SUCCESS,
      data: [],
      pagination: { page, totalPages: 1, totalItems: 0 },
    });
  }

  const filters = `($1::text = '' OR CAST(o.o_id AS TEXT) LIKE $2::text) AND ($3::text = '' OR o.status = $3::text)`;
  const filterValues = [digits, `%${digits}%`, status];

  const [list, count] = await Promise.all([
    pool.query(
      `SELECT o.*,
              COALESCE(u.name, 'Deleted account') AS customer_name,
              u.email AS customer_email,
              c.name AS courier_name
        FROM orders o
        LEFT JOIN users u ON u.u_id = o.user_id
        LEFT JOIN users c ON c.u_id = o.courier_id
        WHERE ${filters}
        ORDER BY o.created_at DESC, o.o_id DESC
        LIMIT $4 OFFSET $5`,
      [...filterValues, pageSize, (page - 1) * pageSize],
    ),
    pool.query(
      `SELECT COUNT(*)::int AS total FROM orders o WHERE ${filters}`,
      filterValues,
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

const getCouriers = asyncWrapper(async (req, res, next) => {
  const result = await pool.query(
    `SELECT u.u_id, u.name, u.email,
      COUNT(o.o_id) FILTER (WHERE o.status = 'Shipped')::int AS active_orders
      FROM users u
      LEFT JOIN orders o ON o.courier_id = u.u_id
      WHERE u.role = 'employee'
      GROUP BY u.u_id
      ORDER BY active_orders ASC, u.name`,
  );
  return res.json({ status: httpStatusText.SUCCESS, data: result.rows });
});

const editRoles = asyncWrapper(async (req, res, next) => {
  const { role } = req.body;
  const { u_id } = req.params;
  if (!ROLES.includes(role)) return fail(next, "Choose a valid role.");
  if (role == "seller" || role == "admin")
    return fail(next, "This role can't be edited");
  if (u_id === currentUserId(req))
    return fail(next, "You can't change your own role.", 403);

  const target = await pool.query(`SELECT role FROM users WHERE u_id = $1`, [
    u_id,
  ]);
  if (!target.rows.length) return fail(next, "User not found.", 404);

  if (target.rows[0].role === "admin" && role !== "admin") {
    const admins = await pool.query(
      `SELECT COUNT(*)::int AS count FROM users WHERE role = 'admin'`,
    );
    if (admins.rows[0].count <= 1)
      return fail(next, "You can't remove the last admin.", 409);
  }

  await pool.query(`UPDATE users SET role = $1 WHERE u_id = $2`, [role, u_id]);
  return res.json({
    status: httpStatusText.SUCCESS,
    message: "Role has been edited successfully",
  });
});

const deleteUser = asyncWrapper(async (req, res, next) => {
  const { u_id } = req.params;
  if (u_id === currentUserId(req))
    return fail(next, "You can't delete your own account here.", 403);

  const target = await pool.query(`SELECT role FROM users WHERE u_id = $1`, [
    u_id,
  ]);
  if (!target.rows.length) return fail(next, "User not found.", 404);

  if (target.rows[0].role === "admin") {
    const admins = await pool.query(
      `SELECT COUNT(*)::int AS count FROM users WHERE role = 'admin'`,
    );
    if (admins.rows[0].count <= 1)
      return fail(next, "You can't delete the last admin.", 409);
  }

  try {
    await pool.query(`DELETE FROM users WHERE u_id = $1`, [u_id]);
  } catch (err) {
    if (err.code === "23503") {
      return fail(
        next,
        "This account is linked to orders or products and can't be deleted.",
        409,
      );
    }
    throw err;
  }
  return res.json({
    status: httpStatusText.SUCCESS,
    message: "Account has been deleted",
  });
});

const adminEditOrder = asyncWrapper(async (req, res, next) => {
  const { status, courierId } = req.body;
  const orderId = Number(req.params.o_id);
  if (!Number.isInteger(orderId)) return fail(next, "Order not found.", 404);

  const client = await pool.connect();
  let problem = null;
  try {
    await client.query("BEGIN");
    const found = await client.query(
      `SELECT status FROM orders WHERE o_id = $1 FOR UPDATE`,
      [orderId],
    );

    if (!found.rows.length) {
      problem = ["Order not found.", 404];
    } else if (found.rows[0].status !== "Processing") {
      problem = ["Only processing orders can be edited.", 409];
    } else if (status === "Shipped") {
      let courier = { rows: [] };
      courier = await client.query(
        `SELECT 1 FROM users WHERE u_id = $1 AND role = 'employee'`,
        [courierId],
      );
      if (!courier.rows.length) problem = ["Choose a valid courier.", 400];
      else {
        await client.query(
          `UPDATE orders SET status = 'Shipped', shipped_at = NOW(), courier_id = $1 WHERE o_id = $2`,
          [courierId, orderId],
        );
      }
    } else if (status === "Cancelled") {
      await client.query(
        `UPDATE products p
          SET quantity = p.quantity + op.qty, sold = p.sold - op.qty
          FROM (SELECT product_id, SUM(quantity)::int AS qty
          FROM order_product WHERE order_id = $1 GROUP BY product_id) op
          WHERE p.p_id = op.product_id`,
        [orderId],
      );
      await client.query(
        `UPDATE orders SET status = 'Cancelled', cancelled_at = NOW() WHERE o_id = $1`,
        [orderId],
      );
    } else {
      problem = ["You can just ship or cancel an order.", 400];
    }

    if (problem) {
      await client.query("ROLLBACK");
    } else {
      await client.query("COMMIT");
    }
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    return next(
      appError.create(
        "Couldn't edit, please try again",
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
      status === "Shipped"
        ? "Order has been shipped."
        : "Order has been cancelled.",
  });
});

/**
 * Product Review Endpoints (Admin & Manager)
 */
const getCheckProducts = asyncWrapper(async (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const pageSize = 10;
  const tab = String(req.query.tab || "all").toLowerCase();
  const rawSearch = String(req.query.search || "").trim();

  // Build base conditions
  const conds = [];
  const vals = [];
  let idx = 1;

  if (rawSearch) {
    conds.push(
      `(p.name ILIKE $${idx} OR pp.name ILIKE $${idx} OR u.name ILIKE $${idx} OR u.email ILIKE $${idx})`,
    );
    vals.push(`%${rawSearch}%`);
    idx++;
  }

  const isEditExpr = `(pp.product_id IS NOT NULL OR (
    EXISTS (SELECT 1 FROM images WHERE product_id = p.p_id AND accepted = true)
    AND EXISTS (SELECT 1 FROM images WHERE product_id = p.p_id AND accepted = false)
  ))`;

  if (tab === "new") conds.push(`NOT ${isEditExpr}`);
  if (tab === "edit") conds.push(isEditExpr);

  const whereClause = `WHERE (p.status = 'Pending' OR pp.product_id IS NOT NULL) ${conds.length ? "AND " + conds.join(" AND ") : ""}`;

  const selectCore = `
    FROM products p
    JOIN users u ON u.u_id = p.seller_id
    LEFT JOIN pending_product pp ON pp.product_id = p.p_id
    LEFT JOIN images i ON i.product_id = p.p_id
    ${whereClause}
    GROUP BY p.p_id, u.name, u.email, pp.name, pp.description, pp.created_at`;

  const [listResult, tabCountResult] = await Promise.all([
    pool.query(
      `SELECT
        p.p_id, p.name, p.description, p.price, p.quantity, p.discount,
        p.status, p.note, p.created_at, p.seller_id,
        u.name AS seller_name, u.email AS seller_email,
        pp.name AS pending_name, pp.description AS pending_description,
        pp.created_at AS pending_created_at,
        COALESCE(
          json_agg(
            json_build_object('image_id', i.image_id, 'image', i.image,
              'sort_order', i.sort_order, 'accepted', i.accepted)
            ORDER BY i.sort_order ASC, i.created_at ASC
          ) FILTER (WHERE i.image_id IS NOT NULL), '[]'
        ) AS images,
        COALESCE((
          SELECT json_agg(json_build_object('c_id', c.c_id, 'name', c.name))
          FROM product_category pc JOIN category c ON c.c_id = pc.category_id
          WHERE pc.product_id = p.p_id
        ), '[]') AS categories
      ${selectCore}
      ORDER BY COALESCE(pp.created_at, p.created_at) DESC
      LIMIT $${idx} OFFSET $${idx + 1}`,
      [...vals, pageSize, (page - 1) * pageSize],
    ),
    pool.query(
      `SELECT
        COUNT(DISTINCT p.p_id)::int AS all_count,
        COUNT(DISTINCT p.p_id) FILTER (WHERE ${isEditExpr})::int AS edit_count,
        COUNT(DISTINCT p.p_id) FILTER (WHERE NOT ${isEditExpr})::int AS new_count
       FROM products p
       JOIN users u ON u.u_id = p.seller_id
       LEFT JOIN pending_product pp ON pp.product_id = p.p_id
       WHERE p.status = 'Pending' OR pp.product_id IS NOT NULL`,
      [],
    ),
  ]);

  const total = tabCountResult.rows[0]?.all_count || 0;
  const tc = tabCountResult.rows[0] || {};

  return res.json({
    status: httpStatusText.SUCCESS,
    data: listResult.rows,
    pagination: {
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      totalItems: total,
    },
    counts: {
      all: tc.all_count || 0,
      new: tc.new_count || 0,
      edit: tc.edit_count || 0,
    },
  });
});

const acceptProduct = asyncWrapper(async (req, res, next) => {
  const p_id = req.params.p_id;

  const product = await pool.query(`SELECT * FROM products WHERE p_id = $1`, [
    p_id,
  ]);
  if (product.rows.length === 0) return fail(next, "Product not found", 404);

  const pending = await pool.query(
    `SELECT * FROM pending_product WHERE product_id = $1`,
    [p_id],
  );

  if (pending.rows.length > 0) {
    const { name, description } = pending.rows[0];
    await pool.query(
      `UPDATE products
       SET name = COALESCE(NULLIF($1, ''), name),
           description = COALESCE($2, description),
           status = 'Accepted', note = NULL
       WHERE p_id = $3`,
      [name, description, p_id],
    );
    await pool.query(`DELETE FROM pending_product WHERE product_id = $1`, [
      p_id,
    ]);
  } else {
    await pool.query(
      `UPDATE products SET status = 'Accepted', note = NULL WHERE p_id = $1`,
      [p_id],
    );
  }

  await pool.query(`UPDATE images SET accepted = true WHERE product_id = $1`, [
    p_id,
  ]);

  return res.json({
    status: httpStatusText.SUCCESS,
    message: "Product has been approved and is now live.",
  });
});

const rejectProduct = asyncWrapper(async (req, res, next) => {
  const p_id = req.params.p_id;
  const note = String(req.body?.note || "").trim() || null;

  const prod = await pool.query(`SELECT * FROM products WHERE p_id = $1`, [
    p_id,
  ]);
  if (prod.rows.length === 0) return fail(next, "Product not found", 404);

  const pending = await pool.query(
    `SELECT * FROM pending_product WHERE product_id = $1`,
    [p_id],
  );
  const acceptedImgs = await pool.query(
    `SELECT * FROM images WHERE product_id = $1 AND accepted = true`,
    [p_id],
  );

  if (pending.rows.length > 0 || acceptedImgs.rows.length > 0) {
    // Reject edit: delete pending edits & unaccepted images, keep the accepted version live
    await pool.query(`DELETE FROM pending_product WHERE product_id = $1`, [
      p_id,
    ]);

    const unacceptedImgs = await pool.query(
      `SELECT * FROM images WHERE product_id = $1 AND accepted = false`,
      [p_id],
    );
    await Promise.all(
      unacceptedImgs.rows.map((img) =>
        deleteFromCloudinary(img.image).catch(() => {}),
      ),
    );
    await pool.query(
      `DELETE FROM images WHERE product_id = $1 AND accepted = false`,
      [p_id],
    );
    // Keep status = Accepted but save the note so seller sees why
    await pool.query(
      `UPDATE products SET status = 'Accepted', note = $1 WHERE p_id = $2`,
      [note, p_id],
    );
    return res.json({
      status: httpStatusText.SUCCESS,
      message: "Edit rejected. The note has been sent to the seller.",
    });
  } else {
    // Reject new product
    await pool.query(
      `UPDATE products SET status = 'Rejected', note = $1 WHERE p_id = $2`,
      [note, p_id],
    );
    return res.json({
      status: httpStatusText.SUCCESS,
      message: "Product rejected. The note has been sent to the seller.",
    });
  }
});

module.exports = {
  registerAdmin,
  getStatus,
  getAllUsers,
  getAllOrders,
  getCouriers,
  editRoles,
  deleteUser,
  adminEditOrder,
  getCheckProducts,
  acceptProduct,
  rejectProduct,
};
