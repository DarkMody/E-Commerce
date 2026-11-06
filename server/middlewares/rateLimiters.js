const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const httpStatusText = require("../utils/httpStatusText");

const make = ({
  windowMs,
  limit,
  message,
  keyGenerator,
  skipSuccessfulRequests = false,
}) =>
  rateLimit({
    windowMs,
    limit,
    keyGenerator,
    skipSuccessfulRequests,
    standardHeaders: "draft-7", // sends RateLimit-* and Retry-After headers
    legacyHeaders: false,
    handler: (req, res) =>
      res.status(429).json({ status: httpStatusText.FAIL, message }),
  });

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

const byIp = (req) => ipKeyGenerator(req.ip);
const byUser = (req) => req.currentUser?.id ?? ipKeyGenerator(req.ip);

/* ---------- Safety net for the whole API (generous) ---------- */
const general = make({
  windowMs: 15 * MINUTE,
  limit: 600,
  message: "Too many requests. Please wait a few minutes and try again.",
});

/* ---------- Login: stops password guessing ----------
   Counts per IP + email, and only FAILED logins (a correct login doesn't use an attempt). */
const login = make({
  windowMs: 15 * MINUTE,
  limit: 5,
  skipSuccessfulRequests: true,
  keyGenerator: (req) =>
    `${byIp(req)}:${String(req.body?.email ?? "").toLowerCase()}`,
  message: "Too many login attempts. Please try again in 15 minutes.",
});

/* ---------- Creating accounts (register user / seller) ---------- */
const register = make({
  windowMs: HOUR,
  limit: 5,
  keyGenerator: byIp,
  message:
    "Too many accounts created from this network. Please try again later.",
});

/* ---------- Changing a password (the current password is guessed here too) ---------- */
const changePassword = make({
  windowMs: 15 * MINUTE,
  limit: 5,
  keyGenerator: byUser,
  message: "Too many attempts. Please try again in 15 minutes.",
});

/* ---------- Placing orders ---------- */
const makeOrder = make({
  windowMs: MINUTE,
  limit: 10,
  keyGenerator: byUser,
  message: "You are placing orders too fast. Please wait a minute.",
});

/* ---------- Uploads (add / edit product, profile photo): they cost disk space and CPU ---------- */
const uploads = make({
  windowMs: HOUR,
  limit: 40,
  keyGenerator: byUser,
  message: "Too many uploads. Please try again later.",
});

/* ---------- Heavy dashboard queries (stats) ---------- */
const stats = make({
  windowMs: MINUTE,
  limit: 30,
  keyGenerator: byUser,
  message: "Too many requests. Please slow down.",
});

module.exports = {
  general,
  login,
  register,
  changePassword,
  makeOrder,
  uploads,
  stats,
};
