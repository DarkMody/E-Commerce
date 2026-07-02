const asyncWrapper = require("../middlewares/asyncWrapper");
const httpStatusText = require("../utils/httpStatusText");
const appError = require("../utils/appError");
const multer = require("multer");
const { diskStorage, fileFilter } = require("../utils/image");
const upload = multer({ storage: diskStorage, fileFilter });
const fs = require("fs");

const imageValidating = asyncWrapper(async (req, res, next) => {
  upload.array("images", 10)(req, res, (err) => {
    if (err) {
      if (req.files) {
        req.files.forEach((file) => fs.unlink(file.path, () => {}));
      }
      // const error = appError.create(
      //   "All uploads must be images",
      //   400,
      //   httpStatusText.ERROR,
      // );
      return next(err);
    }
    next();
  });
});
module.exports = imageValidating;
