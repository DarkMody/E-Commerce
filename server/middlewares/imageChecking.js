const asyncWrapper = require("../middlewares/asyncWrapper");
const httpStatusText = require("../utils/httpStatusText");
const appError = require("../utils/appError");
const multer = require("multer");
const { fileFilter, memoryStorage } = require("../utils/image");
const upload = multer({ fileFilter, memoryStorage });
const fs = require("fs");

const productImageValidating = asyncWrapper(async (req, res, next) => {
  upload.array("images", 10)(req, res, (err) => {
    if (err) {
      return next(err);
    }
    next();
  });
});

const profileImageValidating = asyncWrapper(async (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      return next(err);
    }
    next();
  });
});

module.exports = {
  profileImageValidating,
  productImageValidating,
};
