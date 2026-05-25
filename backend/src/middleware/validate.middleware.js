const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/apiResponse');

/**
 * Centrally processes express-validator validation results.
 * If validation fails, returns a formatted errorResponse immediately.
 * Otherwise, hands control over to the next middleware/handler.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 'Validation failed', 400, errors.array());
  }
  next();
};

module.exports = validate;
