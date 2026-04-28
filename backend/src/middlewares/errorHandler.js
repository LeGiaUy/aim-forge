// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`, err.stack);

  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  return res.status(status).json({
    success: false,
    message,
    data: null,
  });
};

export default errorHandler;
