const Joi = require('joi');
const mongoose = require('mongoose');
const createValidationMiddleware = require('../middlewares/requestValidatorMiddleware');

const permitValidationSchema = createValidationMiddleware(
  Joi.object({
    permitNumber: Joi.string().required().messages({
      'string.empty': 'Permit number is required',
      'any.required': 'Permit number is required',
    }),

    issueDate: Joi.date().required().messages({
      'date.base': 'Issue date must be a valid date',
      'any.required': 'Issue date is required',
    }),

    expiryDate: Joi.date().greater(Joi.ref('issueDate')).required().messages({
      'date.base': 'Expiry date must be a valid date',
      'date.greater': 'Expiry date must be after issue date',
      'any.required': 'Expiry date is required',
    }),

    route: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid route ID format',
        'any.required': 'Route ID is required',
      }),

    bus: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid bus ID format',
        'any.required': 'Bus ID is required',
      }),

    operator: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid operator ID format',
        'any.required': 'Operator ID is required',
      }),

    status: Joi.string().valid('active', 'expired', 'suspended').default('active').messages({
      'any.only': 'Status must be one of: active, expired, suspended',
    }),
  })
);

const permitUpdateValidationSchema = createValidationMiddleware(
  Joi.object({
    permitNumber: Joi.string().messages({
      'string.empty': 'Permit number cannot be empty',
    }),

    issueDate: Joi.date().messages({
      'date.base': 'Issue date must be a valid date',
    }),

    expiryDate: Joi.date()
      .when('issueDate', {
        is: Joi.exist(),
        then: Joi.date().greater(Joi.ref('issueDate')),
      })
      .messages({
        'date.base': 'Expiry date must be a valid date',
        'date.greater': 'Expiry date must be after issue date',
      }),

    route: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .messages({
        'string.pattern.base': 'Invalid route ID format',
      }),

    bus: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .messages({
        'string.pattern.base': 'Invalid bus ID format',
      }),

    operator: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .messages({
        'string.pattern.base': 'Invalid operator ID format',
      }),

    status: Joi.string().valid('active', 'expired', 'suspended').messages({
      'any.only': 'Status must be one of: active, expired, suspended',
    }),
  })
    .min(1)
    .messages({
      'object.min': 'At least one field must be provided for update',
    })
);

module.exports = { permitValidationSchema, permitUpdateValidationSchema };
