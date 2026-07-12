const pool = require("../config/db");
const asyncWrapper = require("../middlewares/asyncWrapper");
const httpStatusText = require("../utils/httpStatusText");
const appError = require("../utils/appError");

const getAllCategories = asyncWrapper(async (req, res, next) => {
  const result = await pool.query(`SELECT * FROM category`);
  res.json({ status: httpStatusText.SUCCESS, data: result.rows });
});

const addCategory = asyncWrapper(async (req, res, next) => {
  const { category } = req.body;
  await pool.query(`INSERT INTO category (name) VALUES ($1)`, [category]);
  res.json({
    status: httpStatusText.SUCCESS,
    message: "New Category has been added",
  });
});

const deleteCategory = asyncWrapper(async (req, res, next) => {
  await pool.query(`DELETE FROM category WHERE c_id = $1`, [req.params.c_id]);
  res.json({
    status: httpStatusText.SUCCESS,
    message: "Category has been deleted",
  });
});

const editCategory = asyncWrapper(async (req, res, next) => {
  const { category } = req.body;
  await pool.query(`UPDATE category SET name = $1 WHERE c_id = $2`, [
    category,
    req.params.c_id,
  ]);
});

module.exports = {
  getAllCategories,
  addCategory,
  deleteCategory,
  editCategory,
};
