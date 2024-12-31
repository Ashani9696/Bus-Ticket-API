const Joi = require('joi');
const createValidationMiddleware = require('../middlewares/requestValidatorMiddleware');

const userCreateValidationSchema = createValidationMiddleware(
  Joi.object({
    name: Joi.string().required().messages({
      'string.empty': 'Name is required',
      'any.required': 'Name is required',
    }),

    email: Joi.string().email().required().messages({
      'string.email': 'Invalid email format',
      'any.required': 'Email is required',
    }),

    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required',
    }),

    role: Joi.array()
      .items(Joi.string().valid('admin', 'user', 'bus_operator'))
      .default(['user']),
  })
);

const userUpdateValidationSchema = createValidationMiddleware(
  Joi.object({
    name: Joi.string().messages({
      'string.empty': 'Name cannot be empty',
    }),

    email: Joi.string().email().messages({
      'string.email': 'Invalid email format',
    }),

    password: Joi.string().min(6).messages({
      'string.min': 'Password must be at least 6 characters long',
    }),

    role: Joi.array().items(Joi.string().valid('admin', 'user', 'bus_operator')),
  })
    .min(1)
    .messages({
      'object.min': 'At least one field must be provided for update',
    })
);
module.exports = { userCreateValidationSchema, userUpdateValidationSchema };
