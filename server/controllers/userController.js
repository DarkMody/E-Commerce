const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const asyncWrapper = require("../middlewares/asyncWrapper");
const httpStatusText = require("../utils/httpStatusText");
const appError = require("../utils/appError");
const generateToken = require("../utils/generateToken");

const getAllUsers = asyncWrapper(async (req, res, next) => {
  const result = await pool.query(
    "SELECT u_id, name, email, role, created_at FROM users",
  );
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

const login = asyncWrapper(async (req, res, next) => {
  const { email, password } = req.body;
  const validate = await pool.query("select * from users where email = $1", [
    email,
  ]);
  if (validate.rows.length === 1) {
    const check = await bcrypt.compare(password, validate.rows[0].password);
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

const logout = asyncWrapper(async (req, res, next) => {
  res.clearCookie("accessToken", { path: "/" });
  res.clearCookie("refreshToken", { path: "/" });
  res.json({ status: httpStatusText.SUCCESS, message: "Logged out" });
});

const deleteUser = asyncWrapper(async (req, res, next) => {
  if (
    req.currentUser.id === req.params.u_id ||
    req.currentUser.role === "admin"
  ) {
    await pool.query(`DELETE FROM users WHERE u_id = $1`, [req.params.u_id]);
    return res.json({
      status: httpStatusText.SUCCESS,
      message: "Account has been deleted",
    });
  }
  const error = appError.create(
    "You don't have permission to delete this account",
    403,
    httpStatusText.FAIL,
  );
  return next(error);
});

const editUser = asyncWrapper(async (req, res, next) => {
  if (
    req.currentUser.id === req.params.u_id ||
    req.currentUser.role === "admin"
  ) {
    const allowedFields = ["name", "email", "role"];
    const fieldsToUpdate = Object.keys(req.body).filter((key) =>
      allowedFields.includes(key),
    );
    if (fieldsToUpdate.length === 0) {
      const error = appError.create(
        "No valid fields here",
        400,
        httpStatusText.FAIL,
      );
      return next(error);
    }
    if (fieldsToUpdate.includes("role") && req.currentUser.role !== "admin") {
      const error = appError.create(
        "You don't have permission to edit roles",
        403,
        httpStatusText.FAIL,
      );
      return next(error);
    }
    if (fieldsToUpdate.includes("email")) {
      const validate = await pool.query(
        "select * from users where email = $1",
        [req.body.email],
      );
      if (validate.rows.length !== 0) {
        const error = appError.create(
          "Email Already Exists",
          409,
          httpStatusText.FAIL,
        );
        return next(error);
      }
    }
    const setClause = fieldsToUpdate
      .map((field, i) => `${field} = $${i + 1}`)
      .join(", ");
    const values = fieldsToUpdate.map((field) => req.body[field]);
    values.push(req.currentUser.id);
    const query = `
    UPDATE users
    SET ${setClause}
    WHERE u_id = $${values.length}
    RETURNING *;
  `;
    const result = await pool.query(query, values);
    res.json({ status: httpStatusText.SUCCESS, data: result.rows[0] });
  }
  const error = appError.create(
    "You don't have permission to edit this account",
    403,
    httpStatusText.FAIL,
  );
  return next(error);
});

module.exports = {
  getAllUsers,
  getUser,
  registerUser,
  registerSeller,
  login,
  logout,
  registerAdmin,
  deleteUser,
  editUser,
};
