const pool = require("../config/db");
const asyncWrapper = require("../middlewares/asyncWrapper");
const httpStatusText = require("../utils/httpStatusText");
const appError = require("../utils/appError");

const getProductComments = asyncWrapper(async (req, res, next) => {
  const result = await pool.query(
    `SELECT * FROM comments WHERE product_id = $1`,
    [req.params.p_id],
  );
  res.json({ status: httpStatusText.SUCCESS, data: result.rows });
});

const addComment = asyncWrapper(async (req, res, next) => {
  const { comment, rate } = req.body;

  const result = await pool.query(`SELECT * FROM products where p_id = $1`, [
    req.params.p_id,
  ]);
  if (result.rows.length === 0) {
    const error = appError.create(
      "Product isn't here",
      401,
      httpStatusText.FAIL,
    );
    return next(error);
  }

  const ownerShipCheck = await pool.query(
    `SELECT * FROM products as p JOIN users as u ON p.seller_id = u.u_id WHERE u.u_id = $1`,
    [req.currentUser.id],
  );
  if (ownerShipCheck.rows.length === 0) {
    const commentedBeforeCheck = await pool.query(
      `SELECT * FROM users as u JOIN comments as c ON u.u_id = c.user_id WHERE u.u_id = $1`,
      [req.currentUser.id],
    );
    if (commentedBeforeCheck.rows.length === 0) {
      const result = await pool.query(
        `INSERT INTO comments (rate,comment,product_id,user_id) values ($1, $2, $3, $4) RETURNING *`,
        [rate, comment, req.params.p_id, req.currentUser.id],
      );
      res.json({ status: httpStatusText.SUCCESS, data: result.rows[0] });
    }
    const error = appError.create(
      "You commented before you can't do it again edit your comment if needed",
      403,
      httpStatusText.FAIL,
    );
    return next(error);
  }
  const error = appError.create(
    "You can't rate your own product",
    403,
    httpStatusText.FAIL,
  );
  next(error);
});

const editComment = asyncWrapper(async (req, res, next) => {
  const { comment, rate } = req.body;
  const checkOwnerShip = await pool.query(
    `SELECT * FROM comment WHERE c_id = $1`,
    [req.params.c_id],
  );
  if (checkOwnerShip.rows.length === 0) {
    const error = appError.create(
      "The comment not here",
      401,
      httpStatusText.FAIL,
    );
    return next(error);
  }
  if (req.currentUser.id == checkOwnerShip.rows[0].user_id) {
    await pool.query(
      `UPDATE comment SET rate = $1, comment = $2 WHERE c_id = $3`,
      [rate, comment, req.params.c_id],
    );
    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: "Comment has been edited successfully",
    });
  }
});

const deleteComment = asyncWrapper(async (req, res, next) => {
  const checkOwnerShip = await pool.query(
    `SELECT * FROM comment WHERE c_id = $1`,
    [req.params.c_id],
  );
  if (checkOwnerShip.rows.length === 0) {
    const error = appError.create(
      "The comment not here",
      401,
      httpStatusText.FAIL,
    );
    return next(error);
  }
  if (
    req.currentUser.id == checkOwnerShip.rows[0].user_id ||
    req.currentUser.role == "admin"
  ) {
    await pool.query(`DELETE FROM comments WHERE c_id = $1`, [req.params.c_id]);
    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: "Comment has been deleted successfully",
    });
  }
});

module.exports = {
  getProductComments,
  addComment,
  editComment,
  deleteComment,
};
