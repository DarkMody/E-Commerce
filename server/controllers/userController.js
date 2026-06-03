const pool = require("../DataBase/db");
const bcrypt = require("bcryptjs");
const asyncWrapper = require("../middlewares/asyncWrapper");
const httpStatusText = require("../utils/httpStatusText");
const appError = require("../utils/appError");

const getAllUsers = asyncWrapper(async (req, res, next) => {
  const result = await pool.query("SELECT * FROM users");
  res.json({ status: httpStatusText.SUCCESS, data: result.rows });
});

const register = asyncWrapper(async (req, res, next) => {
  const { name, email, password } = req.body;
  const validate = await pool.query("select * from users where email = $1", [
    email,
  ]);
  if (validate.rows.length === 0) {
    const query = "INSERT INTO users (name,email,password) values($1 ,$2 ,$3)";
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(query, [name, email, hashed]);
    return res.json({
      status: httpStatusText.SUCCESS,
      message: "Registered successfully",
    });
  }
  const error = appError.create(
    "Email Already Exists",
    401,
    httpStatusText.FAIL,
  );
  return next(error);
});

module.exports = {
  getAllUsers,
  register,
};
