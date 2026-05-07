exports.successResponse = (res, data, message = 'Success', statusCode = 200, pagination = null) => {
  const response = { success: true, message, data };
  if (pagination) response.pagination = pagination;
  return res.status(statusCode).json(response);
};

exports.errorResponse = (res, message = 'Error', statusCode = 400, errors = []) => {
  return res.status(statusCode).json({ success: false, message, errors });
};
