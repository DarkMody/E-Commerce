const pool = require("../config/db");
const asyncWrapper = require("../middlewares/asyncWrapper");
const httpStatusText = require("../utils/httpStatusText");
const appError = require("../utils/appError");
const fs = require("fs");
const path = require("path");

const getAllProducts = asyncWrapper(async (req, res, next) => {
  const result = await pool.query(`SELECT * FROM products`);
  res.json({ status: httpStatusText.SUCCESS, data: result.rows });
});

const getSellerProducts = asyncWrapper(async (req, res, next) => {
  const seller_id = req.currentUser.id;
  console.log(seller_id);
  const result = await pool.query(
    `SELECT * FROM products WHERE seller_id = $1`,
    [seller_id],
  );
  res.json({ status: httpStatusText.SUCCESS, data: result.rows });
});

const getProduct = asyncWrapper(async (req, res, next) => {
  console.log(req.params.p_id);
  const p_id = req.params.p_id;
  const product = await pool.query(`SELECT * FROM products where p_id = $1`, [
    p_id,
  ]);
  const categories = await pool.query(
    `select c.name from product_category as pc 
    JOIN products as p on p.p_id = pc.product_id 
    JOIN category as c on c.c_id = pc.category_id`,
  );
  const images = await pool.query(
    `SELECT image FROM images as i 
    JOIN products as p on i.product_id = p.p_id`,
  );
  res.json({
    status: httpStatusText.SUCCESS,
    data: result.rows[0],
    categories,
    images,
  });
});

const addProduct = asyncWrapper(async (req, res, next) => {
  const seller_id = req.currentUser.id;
  console.log(req.currentUser);
  const { name, description, price, quantity, categories } = req.body;
  if (!req.files || req.files.length === 0) {
    const error = appError.create(
      "At least one image is required",
      400,
      httpStatusText.FAIL,
    );
    return next(error);
  }
  const query = `INSERT INTO products (name, description, price, quantity, seller_id)
  VALUES ($1, $2, $3, $4, $5) RETURNING *`;
  const result = await pool.query(query, [
    name,
    description,
    price,
    quantity,
    seller_id,
  ]);
  const p_id = result.rows[0].p_id;
  const insertImagesPromises = req.files.map(async (file, index) => {
    const imageUrl = file.filename;
    return await pool.query(
      `INSERT INTO images (product_id, image, sort_order) VALUES ($1, $2, $3)`,
      [p_id, imageUrl, index],
    );
  });
  await Promise.all(insertImagesPromises);

  // const insertCategoriesPromises = categories.map(async (category) => {
  //   const check = await pool.query(`SELECT * FROM category WHERE c_id = $1`, [
  //     category,
  //   ]);
  //   if (check.rows.length !== 0) {
  //     return await pool.query(`INSERT INTO product_category VALUES ($1 , $2)`, [
  //       p_id,
  //       category,
  //     ]);
  //   }
  // });
  // await Promise.all(insertCategoriesPromises);

  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "Product has been added successfully",
  });
});

const deleteProduct = asyncWrapper(async (req, res, next) => {
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
  if (
    req.currentUser.id == result.rows[0].seller_id ||
    req.currentUser.role == "admin"
  ) {
    const images = await pool.query(
      `SELECT * FROM images WHERE product_id = $1`,
      [req.params.p_id],
    );
    console.log(images.rows);
    Array.from(images.rows).forEach((img) => {
      const imagePath = path.join(__dirname, "..", "uploads", img.image);
      fs.unlink(imagePath, () => {});
    });
    await pool.query(`DELETE FROM products WHERE p_id = $1`, [req.params.p_id]);
    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: "Product has been deleted successfully",
    });
  }
  const error = appError.create(
    "You are not this product's owner",
    401,
    httpStatusText.FAIL,
  );
  next(error);
});

const editProduct = asyncWrapper(async (req, res, next) => {
  const { name, description, price, quantity, categories } = req.body;
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
  if (
    req.currentUser.id == result.rows[0].seller_id ||
    req.currentUser.role == "admin"
  ) {
    const images = await pool.query(
      `SELECT * FROM images WHERE product_id = $1`,
      [req.params.p_id],
    );

    // Deleting old images
    Array.from(images.rows).forEach((img) => {
      const imagePath = path.join(__dirname, "..", "uploads", img.image);
      fs.unlink(imagePath, () => {});
    });
    await pool.query(`DELETE FROM images WHERE product_id = $1`, [
      req.params.p_id,
    ]);
    await pool.query(`DELETE FROM product_category WHERE product_id = $1`, [
      req.params.p_id,
    ]);

    // editing product
    await pool.query(
      `UPDATE products SET name = $1, description = $2, price = $3, quantity = GREATEST(quantity + $4 , 0) WHERE p_id = $5;`,
      [name, description, price, quantity, req.params.p_id],
    );

    // Adding the new images
    const insertImagesPromises = req.files.map((file, index) => {
      const imageUrl = file.filename;
      return pool.query(
        `INSERT INTO images (product_id, image, sort_order) VALUES ($1, $2, $3)`,
        [req.params.p_id, imageUrl, index],
      );
    });
    await Promise.all(insertImagesPromises);

    const insertCategoriesPromises = categories.map(async (category) => {
      const check = await pool.query(`SELECT * FROM category WHERE c_id = $1`, [
        category,
      ]);
      if (check.rows.length !== 0) {
        return await pool.query(
          `INSERT INTO product_category VALUES ($1 , $2)`,
          [req.params.p_id, category],
        );
      }
    });
    await Promise.all(insertCategoriesPromises);

    return res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: "Product has been edited successfully",
    });
  }
  const error = appError.create(
    "You are not this product's owner",
    401,
    httpStatusText.FAIL,
  );
  next(error);
});

module.exports = {
  getAllProducts,
  getSellerProducts,
  getProduct,
  addProduct,
  deleteProduct,
  editProduct,
};
