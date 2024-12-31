const Joi = require('joi');
const createValidationMiddleware = require('../middlewares/requestValidatorMiddleware');

const busValidationSchema = createValidationMiddleware(
  Joi.object({
    registrationNumber: Joi.string().required().messages({
      'string.empty': 'Registration number is required',
      'any.required': 'Registration number is required',
    }),

    model: Joi.string().required().messages({
      'string.empty': 'Bus model is required',
      'any.required': 'Bus model is required',
    }),

    manufacturer: Joi.string().required().messages({
      'string.empty': 'Manufacturer is required',
      'any.required': 'Manufacturer is required',
    }),

    capacity: Joi.object({
      seating: Joi.number().required().min(1).messages({
        'number.base': 'Seating capacity must be a number',
        'any.required': 'Seating capacity is required',
        'number.min': 'Seating capacity must be at least 1',
      }),
      standing: Joi.number().default(0).min(0).messages({
        'number.base': 'Standing capacity must be a number',
        'number.min': 'Standing capacity cannot be negative',
      }),
    })
      .required()
      .messages({
        'any.required': 'Capacity is required',
      }),

    features: Joi.object({
      hasAC: Joi.boolean().default(false),
      hasWifi: Joi.boolean().default(false),
      hasUSBCharging: Joi.boolean().default(false),
      hasEntertainmentSystem: Joi.boolean().default(false),
    })
      .default()
      .messages({
        'any.required': 'Bus features are required',
      }),

    busType: Joi.string().valid('luxury', 'semiLuxury', 'normal').required().messages({
      'any.only': 'Bus type must be one of: luxury, semiLuxury, normal',
      'any.required': 'Bus type is required',
    }),
  })
);

const busUpdateValidationSchema = createValidationMiddleware(
  Joi.object({
    registrationNumber: Joi.string().messages({
      'string.empty': 'Registration number cannot be empty',
    }),

    model: Joi.string().messages({
      'string.empty': 'Bus model cannot be empty',
    }),

    manufacturer: Joi.string().messages({
      'string.empty': 'Manufacturer cannot be empty',
    }),

    capacity: Joi.object({
      seating: Joi.number().min(1).messages({
        'number.base': 'Seating capacity must be a number',
        'number.min': 'Seating capacity must be at least 1',
      }),
      standing: Joi.number().min(0).messages({
        'number.base': 'Standing capacity must be a number',
        'number.min': 'Standing capacity cannot be negative',
      }),
    }).messages({
      'object.base': 'Capacity must be an object',
    }),

    features: Joi.object({
      hasAC: Joi.boolean(),
      hasWifi: Joi.boolean(),
      hasUSBCharging: Joi.boolean(),
      hasEntertainmentSystem: Joi.boolean(),
    }).messages({
      'object.base': 'Features must be an object',
    }),

    busType: Joi.string().valid('luxury', 'semiLuxury', 'normal').messages({
      'any.only': 'Bus type must be one of: luxury, semiLuxury, normal',
    }),
  })
    .min(1)
    .messages({
      'object.min': 'At least one field must be provided for update',
    })
);

module.exports = { busValidationSchema, busUpdateValidationSchema };
