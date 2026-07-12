const httpStatusText = require("../utils/httpStatusText");
const appError = require("../utils/appError");

function verifyRole(...validRoles) {
  return (req, res, next) => {
    const userRole = req.currentUser.role;
    if (!userRole || !validRoles.includes(userRole)) {
      const error = appError.create(
        "Access denied: insufficient permissions",
        403,
        httpStatusText.FAIL,
      );
      return next(error);
    }
    next();
  };
}

module.exports = verifyRole;
