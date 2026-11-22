const pool = require("../config/db");
const asyncWrapper = require("../middlewares/asyncWrapper");
const httpStatusText = require("../utils/httpStatusText");
const appError = require("../utils/appError");
const { uploadToCloudinary, deleteFromCloudinary } = require("../utils/image");

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
    page,
  } = req.query;

  const pageSize = 20;

  let subQuery = `SELECT DISTINCT p.*, i.image, COALESCE(ROUND(avg(c.rate) OVER (PARTITION BY p.p_id), 2),0) AS rate, count(c.rate) OVER (PARTITION BY p.p_id) AS people FROM products AS p
                  LEFT JOIN comments AS c on p.p_id = c.product_id
                  JOIN images AS i on i.product_id = p.p_id and i.sort_order = 0 and i.accepted = true
                  `;

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
  subQuery += " WHERE p.status = 'Accepted' ";
  let query = `SELECT * FROM (${subQuery})`;
  if (conditions2.length) query += " WHERE " + conditions2.join(" AND ");

  if (sort && sort != "default") {
    query += ` ORDER BY ${sort.split("-").join(" ")} `;
  }
  const count = await pool.query(query, values);
  const priceValues = category.length ? [category] : [];
  const price = await pool.query(
    `SELECT COALESCE(MAX(product.price), 1000) AS max,
    COALESCE(MIN(product.price), 0) AS min FROM (${subQuery}) AS product`,
    priceValues,
  );
  if (!page) page = 1;
  query += ` LIMIT ${pageSize} OFFSET $${i++} `;
  values.push((page - 1) * pageSize);
  const result = await pool.query(query, values);
  const [totalItems, totalPages] = [
    count.rows.length,
    Math.ceil(count.rows.length / pageSize),
  ];

  const usedCategory = await pool.query(
    `
    SELECT DISTINCT c.* FROM category AS c
    JOIN product_category AS pc ON c.c_id = pc.category_id
    JOIN products AS p ON pc.product_id = p.p_id
    WHERE p.status != 'Rejected'
    `,
  );

  res.json({
    status: httpStatusText.SUCCESS,
    data: result.rows,
    pagination: { page, totalItems, totalPages },
    price: price.rows,
    category: usedCategory.rows,
  });
});

const getSellerProducts = asyncWrapper(async (req, res, next) => {
  const seller_id = req.currentUser.id;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const pageSize = 12;
  const tab = String(req.query.tab || "all").toLowerCase();
  const search = String(req.query.search || req.query.name || "").trim();

  let stockCondition = "";
  if (tab === "out") {
    stockCondition = "AND p.quantity = 0";
  } else if (tab === "low") {
    stockCondition = "AND p.quantity > 0 AND p.quantity <= 5";
  }

  const baseConditions = ["p.seller_id = $1"];
  const baseValues = [seller_id];

  if (search) {
    baseConditions.push(`p.name ILIKE $${baseValues.length + 1}`);
    baseValues.push(`%${search}%`);
  }

  const whereClause = `WHERE ${baseConditions.join(" AND ")} ${stockCondition}`;

  const [list, countResult, tabCounts] = await Promise.all([
    pool.query(
      `SELECT p.*, i.image,
              COALESCE(ROUND(c.rate, 2), 0) AS rate,
              COALESCE(c.people, 0) AS people
        FROM products p
        LEFT JOIN images i ON i.product_id = p.p_id AND i.sort_order = 0
        LEFT JOIN (
          SELECT product_id, AVG(rate) AS rate, COUNT(rate)::int AS people
          FROM comments
          GROUP BY product_id
        ) c ON c.product_id = p.p_id
        ${whereClause}
        ORDER BY p.created_at DESC, p.p_id DESC
        LIMIT $${baseValues.length + 1} OFFSET $${baseValues.length + 2}`,
      [...baseValues, pageSize, (page - 1) * pageSize],
    ),
    pool.query(
      `SELECT COUNT(*)::int AS total FROM products p ${whereClause}`,
      baseValues,
    ),
    pool.query(
      `
      SELECT 
        COUNT(*)::int AS all_count,
        COUNT(*) FILTER (WHERE p.quantity > 0 AND p.quantity <= 5)::int AS low_count,
        COUNT(*) FILTER (WHERE p.quantity = 0)::int AS out_count
      FROM products p
      WHERE ${baseConditions.join(" AND ")}`,
      baseValues,
    ),
  ]);

  const total = countResult.rows[0].total;
  const counts = {
    all: tabCounts.rows[0].all_count,
    low: tabCounts.rows[0].low_count,
    out: tabCounts.rows[0].out_count,
  };

  res.json({
    status: httpStatusText.SUCCESS,
    data: list.rows,
    pagination: {
      page,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      totalItems: total,
    },
    counts,
  });
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

  if (product.rows.length === 0) {
    const error = appError.create(
      "Product not found",
      404,
      httpStatusText.FAIL,
    );
    return next(error);
  }

  const categories = await pool.query(
    `select c.* from product_category as pc 
    JOIN products as p on p.p_id = pc.product_id 
    JOIN category as c on c.c_id = pc.category_id
    WHERE p.p_id = $1`,
    [p_id],
  );
  const images = await pool.query(
    `SELECT image, accepted, sort_order FROM images as i 
    WHERE i.product_id = $1
    ORDER BY i.sort_order, i.created_at ASC`,
    [p_id],
  );

  const pending = await pool.query(
    `SELECT * FROM pending_product WHERE product_id = $1`,
    [p_id],
  );

  res.json({
    status: httpStatusText.SUCCESS,
    data: {
      product: product.rows[0],
      category: categories.rows,
      image: images.rows,
      pending: pending.rows[0] || null,
    },
  });
});

const addProduct = asyncWrapper(async (req, res, next) => {
  const seller_id = req.currentUser.id;
  const { name, description, price, quantity, categories, discount } = req.body;

  const disc =
    discount !== undefined && discount !== "" && discount !== null
      ? Number(discount)
      : 0;

  if (isNaN(disc) || disc < 0 || disc > 100) {
    const error = appError.create(
      "Discount must be between 0 and 100",
      400,
      httpStatusText.FAIL,
    );
    return next(error);
  }

  let category = [];
  if (categories) {
    category = JSON.parse(categories);
  }

  if ((name || "").trim() == "") {
    const error = appError.create(
      "Please put a name for product",
      400,
      httpStatusText.FAIL,
    );
    return next(error);
  }

  if (!price || price == 0) {
    const error = appError.create(
      "The price must be bigger than 0",
      400,
      httpStatusText.FAIL,
    );
    return next(error);
  }

  if (!quantity || quantity == 0) {
    const error = appError.create(
      "The quantity must be bigger than 0",
      400,
      httpStatusText.FAIL,
    );
    return next(error);
  }

  const savedUrls = [];

  try {
    for (const file of req.files) {
      const imageUrl = await uploadToCloudinary(file.buffer);
      savedUrls.push(imageUrl);
    }

    const query = `INSERT INTO products (name, description, price, quantity, seller_id, discount, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'Pending') RETURNING *`;
    const result = await pool.query(query, [
      name,
      description,
      price,
      quantity,
      seller_id,
      disc,
    ]);
    const p_id = result.rows[0].p_id;

    const insertImagesPromises = savedUrls.map((url, index) =>
      pool.query(
        `INSERT INTO images (product_id, image, sort_order, accepted) VALUES ($1, $2, $3, false)`,
        [p_id, url, index],
      ),
    );
    await Promise.all(insertImagesPromises);

    const insertCategoriesPromises = category.map(async (c) => {
      const check = await pool.query(`SELECT * FROM category WHERE c_id = $1`, [
        c,
      ]);
      if (check.rows.length !== 0) {
        return pool.query(`INSERT INTO product_category VALUES ($1, $2)`, [
          p_id,
          c,
        ]);
      }
    });
    await Promise.all(insertCategoriesPromises);

    return res.status(201).json({
      status: httpStatusText.SUCCESS,
      message: "Product has been submitted and is pending admin approval",
    });
  } catch (err) {
    await Promise.all(savedUrls.map((url) => deleteFromCloudinary(url)));
    return next(
      appError.create("Could not add product", 500, httpStatusText.ERROR),
    );
  }
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
    await Promise.all(
      Array.from(images.rows).map((img) => deleteFromCloudinary(img.image)),
    );
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
  const {
    name,
    description,
    price,
    quantity,
    categories,
    existingImages,
    discount,
  } = req.body;

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
    let category = [];
    if (categories) {
      category = JSON.parse(categories);
    }

    if ((name || "").trim() == "") {
      const error = appError.create(
        "Please put a name for product",
        400,
        httpStatusText.FAIL,
      );
      return next(error);
    }

    if (!price || price == 0) {
      const error = appError.create(
        "The price must be bigger than 0",
        400,
        httpStatusText.FAIL,
      );
      return next(error);
    }

    const keptImages = existingImages ? JSON.parse(existingImages) : [];
    const currentProduct = result.rows[0];
    const isRejected = currentProduct.status === "Rejected";

    const nameChanged =
      (name || "").trim() !== (currentProduct.name || "").trim();
    const descChanged =
      (description || "").trim() !== (currentProduct.description || "").trim();
    const hasNewImages = req.files && req.files.length > 0;

    const disc =
      discount !== undefined && discount !== "" && discount !== null
        ? Number(discount)
        : currentProduct.discount || 0;

    if (isNaN(disc) || disc < 0 || disc > 100) {
      const error = appError.create(
        "Discount must be between 0 and 100",
        400,
        httpStatusText.FAIL,
      );
      return next(error);
    }

    const savedUrls = [];

    try {
      for (const file of req.files) {
        const imageUrl = await uploadToCloudinary(file.buffer);
        savedUrls.push(imageUrl);
      }

      // 1. Price, quantity, and discount ALWAYS update immediately
      await pool.query(
        `UPDATE products SET price = $1, quantity = GREATEST(quantity + $2, 0), discount = $3 WHERE p_id = $4`,
        [price, quantity || 0, disc, req.params.p_id],
      );

      // 2. Categories update immediately
      await pool.query(`DELETE FROM product_category WHERE product_id = $1`, [
        req.params.p_id,
      ]);
      const insertCategoriesPromises = category.map(async (catId) => {
        const check = await pool.query(
          `SELECT * FROM category WHERE c_id = $1`,
          [catId],
        );
        if (check.rows.length !== 0) {
          return await pool.query(
            `INSERT INTO product_category VALUES ($1, $2)`,
            [req.params.p_id, catId],
          );
        }
      });
      await Promise.all(insertCategoriesPromises);

      // 3. Handle name, description, and images depending on product state
      if (isRejected) {
        // Product was rejected; seller edited it to resubmit for review
        await pool.query(
          `UPDATE products SET name = $1, description = $2, status = 'Pending' WHERE p_id = $3`,
          [(name || "").trim(), (description || "").trim(), req.params.p_id],
        );
        await pool.query(`DELETE FROM pending_product WHERE product_id = $1`, [
          req.params.p_id,
        ]);

        // Remove old images not kept
        const removedImages = images.rows.filter(
          (oldImg) => !keptImages.includes(oldImg.image),
        );
        await Promise.all(
          removedImages.map((img) => deleteFromCloudinary(img.image)),
        );
        await pool.query(`DELETE FROM images WHERE product_id = $1`, [
          req.params.p_id,
        ]);

        const allImages = [...keptImages, ...savedUrls];
        const insertImagesPromises = allImages.map((imgUrl, index) =>
          pool.query(
            `INSERT INTO images (product_id, image, sort_order, accepted) VALUES ($1, $2, $3, false)`,
            [req.params.p_id, imgUrl, index],
          ),
        );
        await Promise.all(insertImagesPromises);

        return res.status(200).json({
          status: httpStatusText.SUCCESS,
          message: "Product resubmitted for admin approval",
        });
      }

      // For Accepted / Pending products:
      let needsApproval = false;

      // A) Name / Description changes go to pending_product
      if (nameChanged || descChanged) {
        needsApproval = true;
        await pool.query(
          `INSERT INTO pending_product (product_id, name, description)
           VALUES ($1, $2, $3)
           ON CONFLICT (product_id) DO UPDATE SET name = $2, description = $3`,
          [req.params.p_id, (name || "").trim(), (description || "").trim()],
        );
      }

      // B) New images go to images table with accepted = false
      if (hasNewImages) {
        needsApproval = true;
        const currentCount = keptImages.length;
        const insertImagesPromises = savedUrls.map((imgUrl, index) =>
          pool.query(
            `INSERT INTO images (product_id, image, sort_order, accepted) VALUES ($1, $2, $3, false)`,
            [req.params.p_id, imgUrl, currentCount + index],
          ),
        );
        await Promise.all(insertImagesPromises);
      }

      if (needsApproval) {
        await pool.query(
          `UPDATE products SET status = 'Pending' WHERE p_id = $1`,
          [req.params.p_id],
        );
        return res.status(200).json({
          status: httpStatusText.SUCCESS,
          message:
            "Product updated. Name, description, or image changes are pending admin approval.",
        });
      }

      return res.status(200).json({
        status: httpStatusText.SUCCESS,
        message: "Product updated successfully.",
      });
    } catch (err) {
      await Promise.all(savedUrls.map((url) => deleteFromCloudinary(url)));
      return next(
        appError.create("Could not add product", 500, httpStatusText.ERROR),
      );
    }
  }
  const error = appError.create(
    "You are not this product's owner",
    401,
    httpStatusText.FAIL,
  );
  next(error);
});

const boughtProduct = asyncWrapper(async (req, res, next) => {
  const boughtCheck = await pool.query(
    `SELECT * FROM products AS p
        LEFT JOIN order_product AS op ON op.product_id = p.p_id
        LEFT JOIN orders AS o ON o.o_id = op.order_id
        LEFT JOIN users AS u ON u.u_id = o.user_id
        WHERE u.u_id = $1 AND p.p_id = $2 AND o.status = 'Delivered'`,
    [req.currentUser.id, req.params.p_id],
  );
  res.json({
    status: httpStatusText.SUCCESS,
    data: boughtCheck.rows.length ? true : false,
  });
});
module.exports = {
  getAllProducts,
  getSellerProducts,
  getProduct,
  addProduct,
  deleteProduct,
  editProduct,
  boughtProduct,
};
