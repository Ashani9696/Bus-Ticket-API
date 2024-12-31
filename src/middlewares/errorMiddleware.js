const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      success: false,
      error: {
        statusCode: err.statusCode,
        message: err.message,
        stack: err.stack,
      },
    });
  } else {
    // Production
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = errorHandler;
