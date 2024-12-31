const Joi = require('joi');
const createValidationMiddleware = require('../middlewares/requestValidatorMiddleware');

const routeCreationValidationSchema = createValidationMiddleware(
  Joi.object({
    routeNumber: Joi.string().required().messages({
      'string.empty': 'Route number is required',
      'any.required': 'Route number is required',
    }),

    name: Joi.string().required().messages({
      'string.empty': 'Route name is required',
      'any.required': 'Route name is required',
    }),

    category: Joi.string().valid('Express', 'Local', 'Night', 'School', 'Special').required().messages({
      'any.only': 'Route category must be one of: Express, Local, Night, School, Special',
      'string.empty': 'Route category is required',
      'any.required': 'Route category is required',
    }),

    stops: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().required(),
          location: Joi.object({
            type: Joi.string().valid('Point').default('Point').required(),
            coordinates: Joi.array().items(Joi.number()).length(2).required().messages({
              'array.length': 'Coordinates must contain exactly two elements [longitude, latitude]',
              'array.base': 'Coordinates must be an array of numbers',
              'any.required': 'Coordinates are required',
            }),
          }).required(),
          distanceFromStart: Joi.number().required().messages({
            'number.base': 'Distance from start must be a number',
          }),
          estimatedTime: Joi.number().required().messages({
            'number.base': 'Estimated time must be a number',
          }),
        })
      )
      .min(1)
      .required()
      .messages({
        'array.base': 'Stops must be an array of stop objects',
        'array.min': 'At least one stop is required',
      }),

    schedules: Joi.array()
      .items(
        Joi.object({
          departureTime: Joi.string()
            .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
            .required()
            .messages({
              'string.pattern.base': 'Departure time must be in HH:MM format',
            }),
          operatingDays: Joi.array()
            .items(Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'))
            .required(),
        })
      )
      .required(),

    fares: Joi.array()
      .items(
        Joi.object({
          fromStop: Joi.string().required(),
          toStop: Joi.string().required(),
          amount: Joi.number().required().min(0),
        })
      )
      .required(),

    distance: Joi.number().required().messages({
      'number.base': 'Total route distance must be a number',
    }),

    estimatedDuration: Joi.number().required().messages({
      'number.base': 'Estimated duration must be a number',
    }),

    restrictions: Joi.object({
      maxCapacity: Joi.number().required().min(1),
      allowStanding: Joi.boolean().default(true),
    }).required(),

    features: Joi.object({
      hasWifi: Joi.boolean().default(false),
      hasAC: Joi.boolean().default(false),
    }).required(),
  })
);

const routeUpdateValidationSchema = createValidationMiddleware(
  Joi.object({
    routeNumber: Joi.string().messages({
      'string.empty': 'Route number cannot be empty',
    }),

    name: Joi.string().messages({
      'string.empty': 'Route name cannot be empty',
    }),

    category: Joi.string().valid('Express', 'Local', 'Night', 'School', 'Special').messages({
      'any.only': 'Route category must be one of: Express, Local, Night, School, Special',
    }),

    stops: Joi.array().items(
      Joi.object({
        name: Joi.string(),
        location: Joi.object({
          type: Joi.string().valid('Point').default('Point'),
          coordinates: Joi.array().items(Joi.number()).length(2),
        }),
        distanceFromStart: Joi.number(),
        estimatedTime: Joi.number(),
      })
    ),

    schedules: Joi.array().items(
      Joi.object({
        departureTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
        operatingDays: Joi.array().items(
          Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
        ),
      })
    ),

    fares: Joi.array().items(
      Joi.object({
        fromStop: Joi.string(),
        toStop: Joi.string(),
        amount: Joi.number().min(0),
      })
    ),

    distance: Joi.number().messages({
      'number.base': 'Total route distance must be a number',
    }),

    estimatedDuration: Joi.number().messages({
      'number.base': 'Estimated duration must be a number',
    }),

    restrictions: Joi.object({
      maxCapacity: Joi.number().min(1),
      allowStanding: Joi.boolean(),
    }),

    features: Joi.object({
      hasWifi: Joi.boolean(),
      hasAC: Joi.boolean(),
    }),

    status: Joi.string().valid('Active', 'Suspended', 'Discontinued'),
  })
    .min(1)
    .messages({
      'object.min': 'At least one field must be provided for update',
    })
);

module.exports = { routeCreationValidationSchema, routeUpdateValidationSchema };
