const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const asyncWrapper = require("../middlewares/asyncWrapper");
const httpStatusText = require("../utils/httpStatusText");
const appError = require("../utils/appError");
const generateToken = require("../utils/generateToken");

const getAllUsers = asyncWrapper(async (req, res, next) => {
  const result = await pool.query("SELECT u_id, name, email FROM users");
  res.json({ status: httpStatusText.SUCCESS, data: result.rows });
});

const getUser = asyncWrapper(async (req, res, next) => {
  res.json({ status: httpStatusText.SUCCESS, data: req.currentUser });
});

const registerUser = asyncWrapper(async (req, res, next) => {
  const { name, email, password } = req.body;
  const validate = await pool.query("select * from users where email = $1", [
    email,
  ]);
  if (validate.rows.length === 0) {
    const query =
      "INSERT INTO users (name,email,password) values($1 ,$2 ,$3) RETURNING *";
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

const login = asyncWrapper(async (req, res, next) => {
  const { email, password } = req.body;
  const validate = await pool.query("select * from users where email = $1", [
    email,
  ]);
  if (validate.rows.length === 1) {
    const check = bcrypt.compare(password, validate.rows[0].password);
    if (check) {
      const row = validate.rows[0];
      const token = await generateToken(row, res);
      return res.status(201).json({
        status: httpStatusText.SUCCESS,
        data: {
          id: row.u_id,
          name: row.name,
          email: row.email,
          role: row.role,
        },
      });
    } else {
      const error = appError.create(
        "Email or Password is wrong",
        401,
        httpStatusText.FAIL,
      );
      return next(error);
    }
  }
  const error = appError.create("Email not found", 404, httpStatusText.FAIL);
  return next(error);
});

module.exports = {
  getAllUsers,
  getUser,
  registerUser,
  registerSeller,
  login,
};
