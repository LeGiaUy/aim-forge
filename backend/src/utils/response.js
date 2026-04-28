/**
 * Send a successful JSON response
 */
export const sendSuccess = (res, data, message = "Success", status = 200) => {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send an error JSON response
 */
export const sendError = (res, message = "Something went wrong", status = 500) => {
  return res.status(status).json({
    success: false,
    message,
    data: null,
  });
};
