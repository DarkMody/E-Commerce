const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const asyncWrapper = require("../middlewares/asyncWrapper");
const httpStatusText = require("../utils/httpStatusText");
const appError = require("../utils/appError");
const generateToken = require("../utils/generateToken");

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
      const result2 = await client.query(sellerQuery, [
        row.u_id,
        store_name,
        store_location,
      ]);
      await client.query("COMMIT");
      const token = await generateToken(row, res);
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
    return;
  }
  const error = appError.create(
    "Email Already Exists",
    409,
    httpStatusText.FAIL,
  );
  return next(error);
});

const getStats = asyncWrapper(async (req, res, next) => {
  const [start, end] = [
    req.query.start || "2020-1-1",
    req.query.end || "4000-1-1",
  ];
  const result = await pool.query(
    `
    SELECT SUM(p.price * op.quantity) AS total_sales, SUM(op.quantity) AS products_sold FROM orders AS o
    JOIN order_product AS op ON o.o_id = op.order_id
    JOIN products AS p ON op.product_id = p.p_id
    WHERE o.status != 'Cancelled' AND p.seller_id = $1 AND o.created_at BETWEEN $2 AND $3
    `,
    [req.currentUser.id, start, end],
  );
  const products = await pool.query(
    `SELECT op.product_id, p.name, SUM(op.quantity) AS sales FROM orders AS o
    JOIN order_product AS op ON o.o_id = op.order_id
    JOIN products AS p ON op.product_id = p.p_id
    WHERE o.status != 'Cancelled' AND p.seller_id = $1 AND o.created_at BETWEEN $2 AND $3
    GROUP BY op.product_id,p.name`,
    [req.currentUser.id, start, end],
  );
  res.json({
    status: httpStatusText.SUCCESS,
    data: {
      salesTotal: result.rows[0].total_sales,
      productsSold: result.rows[0].products_sold,
      products: products.rows,
    },
  });
});

module.exports = {
  registerSeller,
  getStats,
};
