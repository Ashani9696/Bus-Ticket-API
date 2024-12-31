const Joi = require('joi');
const createValidationMiddleware = require('../middlewares/requestValidatorMiddleware');

const seatValidationSchema = createValidationMiddleware(
  Joi.object({
    rows: Joi.number().required().min(1).messages({
      'number.base': 'Rows must be a number',
      'any.required': 'Rows are required',
      'number.min': 'There must be at least 1 row',
    }),

    columnLayouts: Joi.array()
      .items(Joi.array().items(Joi.string().min(1).max(1)).required())
      .required()
      .min(1)
      .messages({
        'array.base': 'Column layouts must be an array of arrays of seat identifiers',
        'any.required': 'Column layouts are required',
        'array.min': 'At least one row of columns is required',
      }),

    seatTypes: Joi.object()
      .pattern(
        Joi.string().regex(/^\d+$/),
        Joi.object({
          A: Joi.object({
            type: Joi.string().valid('window', 'middle', 'aisle').required(),
            isAisle: Joi.boolean().required(),
          }).required(),
          B: Joi.object({
            type: Joi.string().valid('window', 'middle', 'aisle').required(),
            isAisle: Joi.boolean().required(),
          }).required(),
          C: Joi.object({
            type: Joi.string().valid('window', 'middle', 'aisle').required(),
            isAisle: Joi.boolean().required(),
          }).required(),
        }).required()
      )
      .messages({
        'object.pattern.base': 'Seat types must contain valid seat configurations for each row',
        'any.required': 'Seat types are required',
      }),
  })
);

const seatUpdateValidationSchema = createValidationMiddleware(
  Joi.object({
    rows: Joi.number().min(1).messages({
      'number.base': 'Rows must be a number',
      'number.min': 'There must be at least 1 row',
    }),

    columnLayouts: Joi.array()
      .items(Joi.array().items(Joi.string().min(1).max(1)).required())
      .min(1)
      .messages({
        'array.base': 'Column layouts must be an array of arrays of seat identifiers',
        'array.min': 'At least one row of columns is required',
      }),

    seatTypes: Joi.object()
      .pattern(
        Joi.string().regex(/^\d+$/),
        Joi.object({
          A: Joi.object({
            type: Joi.string().valid('window', 'middle', 'aisle'),
            isAisle: Joi.boolean(),
          }).optional(),
          B: Joi.object({
            type: Joi.string().valid('window', 'middle', 'aisle'),
            isAisle: Joi.boolean(),
          }).optional(),
          C: Joi.object({
            type: Joi.string().valid('window', 'middle', 'aisle'),
            isAisle: Joi.boolean(),
          }).optional(),
        }).optional()
      )
      .messages({
        'object.pattern.base': 'Seat types must contain valid seat configurations for each row',
      }),
  })
);

module.exports = { seatValidationSchema, seatUpdateValidationSchema };
