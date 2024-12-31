class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad Request') {
    return new ErrorHandler(message, 400);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ErrorHandler(message, 401);
  }

  static forbidden(message = 'Forbidden') {
    return new ErrorHandler(message, 403);
  }

  static notFound(message = 'Not Found') {
    return new ErrorHandler(message, 404);
  }

  static conflict(message = 'Conflict') {
    return new ErrorHandler(message, 409);
  }

  static validationError(message = 'Validation Error') {
    return new ErrorHandler(message, 422);
  }

  static internalError(message = 'Internal Server Error') {
    return new ErrorHandler(message, 500);
  }
}

module.exports = ErrorHandler;
