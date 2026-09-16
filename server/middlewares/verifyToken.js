const jwt = require("jsonwebtoken");
const axios = require("axios");
const appError = require("../utils/appError");
const httpStatusText = require("../utils/httpStatusText");
const generateToken = require("../utils/generateToken");
const pool = require("../config/db");

// async function refreshAccessToken(refreshToken) {
//   const response = await axios.post("https://auth-provider.com/oauth/token", {
//     grant_type: "refresh_token",
//     refresh_token: refreshToken,
//     client_id: process.env.CLIENT_ID,
//     client_secret: process.env.CLIENT_SECRET,
//   });

//   return {
//     accessToken: response.data.access_token,
//     refreshToken: response.data.refresh_token, // if provider rotates it
//   };
// }

async function verifyToken(req, res, next) {
  const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;
  if (!accessToken && !refreshToken) {
    const error = appError.create("Please login", 401, httpStatusText.FAIL);
    return next(error);
  }
  if (accessToken) {
    try {
      const user = jwt.verify(accessToken, process.env.JWT_SECRET);
      req.currentUser = user;
      return next();
    } catch (err) {
      if (err.name !== "TokenExpiredError") {
        const error = appError.create(
          "Invalid token",
          401,
          httpStatusText.FAIL,
        );
        return next(error);
      }
    }
  }

  try {
    const id = jwt.decode(refreshToken).id;
    console.log(id);
    const data = await pool.query(
      "select u_id,name,email,role,created_at from users where u_id = $1",
      [id],
    );
    const token = await generateToken(data.rows[0], res);
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.currentUser = user;
    next();
  } catch (err) {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    const error = appError.create("Please login", 401, httpStatusText.FAIL);
    return next(error);
  }
}

module.exports = verifyToken;
