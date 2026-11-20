const { randomUUID: uuidv4 } = require("crypto");
const multer = require("multer");
const appError = require("./appError");
const httpStatusText = require("./httpStatusText");

const diskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    const type = file.mimetype.split("/")[1];
    const fileName = `${uuidv4()}.${type}`;
    cb(null, fileName);
  },
});

const fileFilter = (req, file, cb) => {
  const imgType = file.mimetype.split("/")[0];
  console.log("Received file:", file.originalname, file.mimetype); // debug

  if (imgType === "image") return cb(null, true);
  return cb(
    appError.create("File must be image", 400, httpStatusText.FAIL),
    false,
  );
};

const memoryStorage = multer.memoryStorage();

module.exports = {
  diskStorage,
  fileFilter,
  memoryStorage,
};
