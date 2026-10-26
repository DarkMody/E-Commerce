const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const asyncWrapper = require("../middlewares/asyncWrapper");
const httpStatusText = require("../utils/httpStatusText");
const appError = require("../utils/appError");
const generateToken = require("../utils/generateToken");

// Temporary register way
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
  }
  const error = appError.create(
    "Email Already Exists",
    409,
    httpStatusText.FAIL,
  );
  return next(error);
});

const getStatus = asyncWrapper(async (req, res, next) => {
  const [start, end] = [
    req.query.start || "2020-1-1",
    req.query.end || "4000-1-1",
  ];
  const usersCount = await pool.query(
    `Select COUNT(*) FROM users WHERE created_at >= $1 AND created_at <= $2`,
    [start, end],
  );
  const ordersCount = await pool.query(
    `Select COUNT(*) FROM orders WHERE created_at >= $1 AND created_at <= $2`,
    [start, end],
  );
  const salesTotal = await pool.query(
    `Select SUM(total_price) FROM orders WHERE created_at >= $1 AND created_at <= $2 AND status != 'Cancelled'`,
    [start, end],
  );
  return res.json({
    status: httpStatusText.SUCCESS,
    data: {
      usersCount: usersCount.rows[0].count,
      ordersCount: ordersCount.rows[0].count,
      salesTotal: salesTotal.rows[0].sum,
    },
  });
});

const getAllUsers = asyncWrapper(async (req, res, next) => {
  const [page, search] = [req.query.page ?? 1, req.query.search ?? ""];
  const PageSize = 20;
  let query = `SELECT u_id, name, email, role, created_at FROM users WHERE email ILIKE $1 `;
  const count = await pool.query(query, [`%${search}%`]);
  query += ` LIMIT ${PageSize} OFFSET $2`;
  const result = await pool.query(query, [
    `%${search}%`,
    (page - 1) * PageSize,
  ]);
  const totalItems = count.rows.length;
  const totalPages = Math.ceil(totalItems / PageSize);
  res.json({
    status: httpStatusText.SUCCESS,
    data: result.rows,
    pagination: { page, totalPages },
  });
});

const getAllOrders = asyncWrapper(async (req, res, next) => {
  const [page, search] = [req.query.page ?? 1, req.query.search ?? ""];
  const PageSize = 12;
  let query = `SELECT * FROM orders WHERE CAST(o_id AS TEXT) LIKE $1 `;
  const count = await pool.query(query, [`%${search}%`]);
  query += ` LIMIT ${PageSize} OFFSET $2`;
  const result = await pool.query(query, [
    `%${search}%`,
    (page - 1) * PageSize,
  ]);
  const totalItems = count.rows.length;
  const totalPages = Math.ceil(totalItems / PageSize);
  return res.json({
    status: httpStatusText.SUCCESS,
    data: result.rows,
    pagination: { page, totalPages },
  });
});

const editRoles = asyncWrapper(async (req, res, next) => {
  const [role, u_id] = [req.body.role, req.params.u_id];
  await pool.query(`UPDATE users SET role = $1 WHERE u_id = $2`, [role, u_id]);
  res.json({
    status: httpStatusText.SUCCESS,
    message: "Role has been edited successfully",
  });
});

const deleteUser = asyncWrapper(async (req, res, next) => {
  await pool.query(`DELETE FROM users WHERE u_id = $1`, [req.params.u_id]);
  res.json({
    status: httpStatusText.SUCCESS,
    message: "Account has been deleted",
  });
});
module.exports = {
  registerAdmin,
  getStatus,
  getAllUsers,
  getAllOrders,
  editRoles,
  deleteUser,
};
