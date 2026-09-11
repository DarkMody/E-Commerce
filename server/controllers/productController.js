const pool = require("../config/db");
const asyncWrapper = require("../middlewares/asyncWrapper");
const httpStatusText = require("../utils/httpStatusText");
const appError = require("../utils/appError");
const fs = require("fs");
const path = require("path");

const getAllProducts = asyncWrapper(async (req, res, next) => {
  let {
    category,
    minPrice,
    maxPrice,
    minRate,
    maxRate,
    sort,
    inStock,
    search,
  } = req.query;
  let subQuery = `SELECT DISTINCT p.*, i.image, COALESCE(ROUND(avg(c.rate) OVER (PARTITION BY p.p_id), 2),0) AS rate, count(c.rate) OVER (PARTITION BY p.p_id) AS people FROM products AS p
                  LEFT JOIN comments AS c on p.p_id = c.product_id
                  JOIN images AS i on i.product_id = p.p_id and i.sort_order = 0`;

  const conditions = [];
  const conditions2 = [];
  const values = [];
  let i = 1;

  if (category != undefined) {
    category = Array.isArray(category) ? category : [category];
  } else {
    category = [];
  }

  if (category.length != 0) {
    conditions.push(`JOIN (SELECT DISTINCT pc.product_id FROM product_category AS pc
    WHERE pc.category_id = ANY($${i++} ::uuid[])) AS dpc ON dpc.product_id = p.p_id`);
    values.push(category);
  }
  if (minPrice) {
    conditions2.push(`price >= $${i++}`);
    values.push(Number(minPrice));
  }
  if (maxPrice) {
    conditions2.push(`price <= $${i++}`);
    values.push(Number(maxPrice));
  }
  if (minRate) {
    conditions2.push(`rate >= $${i++}`);
    values.push(Number(minRate));
  }
  if (maxRate) {
    conditions2.push(`rate <= $${i++}`);
    values.push(Number(maxRate));
  }
  if (inStock !== undefined && inStock !== "") {
    if (inStock == "true") conditions2.push(`quantity > $${i++}`);
    else conditions2.push(`quantity = $${i++}`);
    values.push(0);
  }
  if (search) {
    conditions2.push(`name ILIKE $${i++}`);
    values.push(`%${search}%`);
  }
  if (conditions.length) subQuery += " " + conditions.join(" AND ");
  let query = `SELECT * FROM (${subQuery})`;
  if (conditions2.length) query += " WHERE " + conditions2.join(" AND ");

  if (sort && sort != "default") {
    query += ` ORDER BY ${sort.split("-").join(" ")} `;
  }

  const result = await pool.query(query, values);

  res.json({ status: httpStatusText.SUCCESS, data: result.rows });
});

const getSellerProducts = asyncWrapper(async (req, res, next) => {
  const seller_id = req.currentUser.id;
  const result = await pool.query(
    `SELECT DISTINCT p.*, i.image, COALESCE(ROUND(avg(c.rate) OVER (PARTITION BY p.p_id), 2),0) AS rate, count(c.rate) OVER (PARTITION BY p.p_id) AS people FROM products as p
    LEFT JOIN comments as c on p.p_id = c.product_id
    JOIN images as i on i.product_id = p.p_id
    WHERE i.sort_order = 0 and seller_id = $1`,
    [seller_id],
  );
  res.json({ status: httpStatusText.SUCCESS, data: result.rows });
});

const getProduct = asyncWrapper(async (req, res, next) => {
  const p_id = req.params.p_id;
  const product = await pool.query(
    `
    SELECT DISTINCT p.*, COALESCE(ROUND(avg(c.rate) OVER (PARTITION BY p.p_id), 2),0) AS rate, count(c.rate) OVER (PARTITION BY p.p_id) AS people FROM products as p
    LEFT JOIN comments as c on p.p_id = c.product_id
    WHERE p.p_id = $1
    `,
    [p_id],
  );
  const categories = await pool.query(
    `select c.* from product_category as pc 
    JOIN products as p on p.p_id = pc.product_id 
    JOIN category as c on c.c_id = pc.category_id
    WHERE p.p_id = $1`,
    [p_id],
  );
  const images = await pool.query(
    `SELECT image FROM images as i 
    JOIN products as p on i.product_id = p.p_id
    WHERE p.p_id = $1
    ORDER BY i.sort_order`,
    [p_id],
  );
  res.json({
    status: httpStatusText.SUCCESS,
    data: {
      product: product.rows[0],
      category: categories.rows,
      image: images.rows,
    },
  });
});

const addProduct = asyncWrapper(async (req, res, next) => {
  const seller_id = req.currentUser.id;
  const { name, description, price, quantity, categories } = req.body;
  const category = JSON.parse(categories);
  if (name.trim() == "") {
    const error = appError.create(
      "Please put a name for product",
      400,
      httpStatusText.FAIL,
    );
    return next(error);
  }

  if (price == "" || price == 0) {
    const error = appError.create(
      "The price must be bigger than 0",
      400,
      httpStatusText.FAIL,
    );
    return next(error);
  }

  if (quantity == "" || quantity == 0) {
    const error = appError.create(
      "The quantity must be bigger than 0",
      400,
      httpStatusText.FAIL,
    );
    return next(error);
  }

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

  const insertCategoriesPromises = category.map(async (category) => {
    const check = await pool.query(`SELECT * FROM category WHERE c_id = $1`, [
      category,
    ]);
    if (check.rows.length !== 0) {
      return await pool.query(`INSERT INTO product_category VALUES ($1 , $2)`, [
        p_id,
        category,
      ]);
    }
  });
  await Promise.all(insertCategoriesPromises);

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
  const { name, description, price, quantity, categories, existingImages } =
    req.body;
  const category = JSON.parse(categories);
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

    const keptImages = existingImages ? JSON.parse(existingImages) : [];

    const removedImages = images.rows.filter(
      (oldImg) => !keptImages.includes(oldImg.image),
    );
    removedImages.forEach((img) => {
      const filePath = path.join(__dirname, "..", "uploads", img.image);
      fs.unlink(filePath, (err) => {
        if (err) {
          const error = appError.create(
            `Failed to delete ${filePath}: ${err.message}`,
            500,
            httpStatusText.ERROR,
          );
          return next(error);
        }
      });
    });

    const newImages = req.files ? req.files.map((f) => f.filename) : [];
    const finalImages = [...keptImages, ...newImages];
    await pool.query(`DELETE FROM images WHERE product_id = $1`, [
      req.params.p_id,
    ]);

    // editing product
    await pool.query(
      `UPDATE products SET name = $1, description = $2, price = $3, quantity = GREATEST(quantity + $4 , 0) WHERE p_id = $5;`,
      [name, description, price, quantity, req.params.p_id],
    );

    // Adding the new images
    const insertImagesPromises = finalImages.map((img, index) => {
      const imageUrl = img;
      return pool.query(
        `INSERT INTO images (product_id, image, sort_order) VALUES ($1, $2, $3)`,
        [req.params.p_id, imageUrl, index],
      );
    });
    await Promise.all(insertImagesPromises);

    await pool.query(`DELETE FROM product_category WHERE product_id = $1`, [
      req.params.p_id,
    ]);
    const insertCategoriesPromises = category.map(async (category) => {
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
