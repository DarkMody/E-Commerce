const httpStatusText = require("../utils/httpStatusText");
const appError = require("../utils/appError");

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PHONE_REGEX = /^(?:\+20|0)1[0125]\d{8}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const ORDER_ID_REGEX = /^\d+$/;

const validateUUID = (...elements) => {
  return (req, res, next) => {
    for (const element of elements) {
      const val =
        req.params?.[element] ?? req.body?.[element] ?? req.query?.[element];

      if (!val || !UUID_REGEX.test(String(val))) {
        const error = appError.create(
          "Plz enter valid UUID",
          400,
          httpStatusText.FAIL,
        );
        return next(error);
      }
    }
    next();
  };
};

const validatePhone = (element = "phoneNumber", required = true) => {
  return (req, res, next) => {
    const val =
      req.body?.[element] ?? req.params?.[element] ?? req.query?.[element];

    if (val === undefined || val === null || val === "") {
      if (required) {
        const error = appError.create(
          "Plz enter valid egyption phone number",
          400,
          httpStatusText.FAIL,
        );
        return next(error);
      }
      return next();
    }

    if (!PHONE_REGEX.test(String(val))) {
      const error = appError.create(
        "Plz enter valid egyption phone number",
        400,
        httpStatusText.FAIL,
      );
      return next(error);
    }
    next();
  };
};

const validateDate = (...elements) => {
  const fields = elements.length > 0 ? elements : ["start", "end"];
  return (req, res, next) => {
    for (const field of fields) {
      const val =
        req.query?.[field] ?? req.body?.[field] ?? req.params?.[field];

      if (val !== undefined && val !== null && val !== "") {
        if (!DATE_REGEX.test(String(val))) {
          const error = appError.create(
            "Date must look like this 6-11-2026",
            400,
            httpStatusText.FAIL,
          );
          return next(error);
        }
      }
    }
    next();
  };
};

const validateOrderId = (element = "o_id") => {
  return (req, res, next) => {
    const val =
      req.params?.[element] ?? req.body?.[element] ?? req.query?.[element];

    if (!val || !ORDER_ID_REGEX.test(String(val)) || Number(val) <= 0) {
      const error = appError.create(
        "Plz enter valid order ID",
        400,
        httpStatusText.FAIL,
      );
      return next(error);
    }
    next();
  };
};

const validateEmail = (element = "email", required = true) => {
  return (req, res, next) => {
    const val =
      req.body?.[element] ?? req.params?.[element] ?? req.query?.[element];

    if (val === undefined || val === null || val === "") {
      if (required) {
        const error = appError.create(
          "Plz enter valid email",
          400,
          httpStatusText.FAIL,
        );
        return next(error);
      }
      return next();
    }

    if (!EMAIL_REGEX.test(String(val).trim())) {
      const error = appError.create(
        "Plz enter valid email",
        400,
        httpStatusText.FAIL,
      );
      return next(error);
    }
    next();
  };
};

module.exports = {
  validateUUID,
  validatePhone,
  validatePhoneNumber: validatePhone,
  validateDate,
  validateOrderId,
  validateEmail,
};
