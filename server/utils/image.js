const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const appError = require("./appError");
const httpStatusText = require("./httpStatusText");

cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
api_key = process.env.CLOUDINARY_API_KEY;
api_secret = process.env.CLOUDINARY_API_SECRET;

const fileFilter = (req, file, cb) => {
  const imgType = file.mimetype.split("/")[0];
  if (imgType === "image") return cb(null, true);
  return cb(
    appError.create("File must be image", 400, httpStatusText.FAIL),
    false,
  );
};

const memoryStorage = multer.memoryStorage();

const uploadToCloudinary = (fileBuffer, folder = "darkzon") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      },
    );
    stream.end(fileBuffer);
  });
};

const deleteFromCloudinary = async (imageUrl) => {
  if (!imageUrl || !imageUrl.includes("res.cloudinary.com")) return;

  // Extracts "darkzon/abc123xyz" from the full Cloudinary URL
  const parts = imageUrl.split("/upload/")[1];
  const withoutVersion = parts.replace(/^v\d+\//, "");
  const publicId = withoutVersion.substring(0, withoutVersion.lastIndexOf("."));

  await cloudinary.uploader.destroy(publicId);
};

module.exports = {
  fileFilter,
  memoryStorage,
  uploadToCloudinary,
  deleteFromCloudinary,
};
