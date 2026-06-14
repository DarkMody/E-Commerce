const jwt = require("jsonwebtoken");

module.exports = async (payLoad, res) => {
  const accessToken = await jwt.sign(
    {
      id: payLoad.u_id,
      name: payLoad.name,
      email: payLoad.email,
      role: payLoad.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1h",
    },
  );
  const refreshToken = await jwt.sign(
    { id: payLoad.u_id },
    process.env.JWT_SECRET,
    {
      expiresIn: "30d",
    },
  );

  // Set cookies
  const isProduction = process.env.NODE_ENV === "production";
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    maxAge: 60 * 60 * 1000,
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  return accessToken;
};
