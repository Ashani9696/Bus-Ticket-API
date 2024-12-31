const createValidationMiddleware = (schema, validateOptions = {}) => {
  const defaultOptions = {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
    ...validateOptions,
  };

  const formatError = (error) => {
    // Handle Joi validation errors
    if (error.isJoi) {
      const details = error.details.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
        type: err.type,
      }));
      return {
        status: 'error',
        error: 'Validation Error',
        details,
      };
    }

    // Handle external validation errors
    if (error instanceof Error) {
      return {
        status: 'error',
        error: 'Validation Error',
        details: [
          {
            field: 'external',
            message: error.message,
            type: 'external',
          },
        ],
      };
    }

    // Handle unknown errors
    return {
      status: 'error',
      error: 'Validation Error',
      details: [
        {
          field: 'unknown',
          message: 'An unknown validation error occurred',
          type: 'unknown',
        },
      ],
    };
  };

  return async (req, res, next) => {
    try {
      const validationSchema = {
        body: schema.body,
        query: schema.query,
        params: schema.params,
        headers: schema.headers,
      };

      const validatedData = {};

      for (const [key, schemaKey] of Object.entries(validationSchema)) {
        if (schemaKey) {
          try {
            validatedData[key] = await schemaKey.validateAsync(req[key], defaultOptions);
          } catch (error) {
            return res.status(400).json(formatError(error));
          }
        }
      }

      req.validated = validatedData;
      return next();
    } catch (error) {
      console.error('Validation middleware error:', error);
      return res.status(500).json(formatError(error));
    }
  };
};

module.exports = createValidationMiddleware;
