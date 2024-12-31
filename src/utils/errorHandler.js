class ErrorHandler extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  // Static methods for convenience, but maintaining original constructor pattern
  static badRequest(message = 'Bad Request') {
    return new ErrorHandler(400, message);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ErrorHandler(401, message);
  }

  static forbidden(message = 'Forbidden') {
    return new ErrorHandler(403, message);
  }

  static notFound(message = 'Not Found') {
    return new ErrorHandler(404, message);
  }

  static conflict(message = 'Conflict') {
    return new ErrorHandler(409, message);
  }

  static validationError(message = 'Validation Error') {
    return new ErrorHandler(422, message);
  }

  static internalError(message = 'Internal Server Error') {
    return new ErrorHandler(500, message);
  }
}

module.exports = ErrorHandler;
