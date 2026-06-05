const jwt = require("jsonwebtoken");

module.exports = async (payLoad) => {
  const token = jwt.sign(payLoad, process.env.JWT_SECRET, {
    expiresIn: "5d",
  });
  return token;
};
