const Joi = require('joi');
const mongoose = require('mongoose');
const Route = require('../../models/routeModel');
const Bus = require('../../models/busModel');
const User = require('../../models/userModel');
const Permit = require('../../models/permitModel');
const createValidationMiddleware = require('../../middlewares/requestValidatorMiddleware');

const customErrorMessages = {
  'string.empty': '{#label} is required',
  'any.required': '{#label} is required',
  'string.base': '{#label} must be a text value',
  'any.invalid': '{#label} is invalid',
  'date.base': '{#label} must be a valid date',
  'date.format': '{#label} must be in YYYY-MM-DD format',
  'date.greater': '{#label} must be after the issue date',
  'date.max': '{#label} cannot be more than 2 years from issue date',
  'date.min': '{#label} cannot be in the past',
};

const validateObjectId = (value, helpers, entityName) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message(`Please provide a valid ${entityName} ID`);
  }
  return value;
};

const validateEntityExists = async (value, helpers, Model, entityName) => {
  try {
    const entity = await Model.findById(value);
    if (!entity) {
      return helpers.message(`${entityName} with ID ${value} does not exist in our records`);
    }
    return value;
  } catch (error) {
    console.error(`Error checking ${entityName}:`, error);
    return helpers.message(`Unable to verify ${entityName}. Please try again`);
  }
};

const createPermitValidation = {
  body: Joi.object({
    permitNumber: Joi.string()
      .required()
      .trim()
      .pattern(/^PN[0-9]{5}$/)
      .messages({
        'string.pattern.base': 'Permit number must start with PN followed by 5 digits (e.g., PN12345)',
        ...customErrorMessages,
      }),

    issueDate: Joi.date()
      .iso()
      .required()
      .min('now')
      .messages({
        'date.min': 'Issue date must be today or a future date',
        ...customErrorMessages,
      }),

    expiryDate: Joi.date()
      .iso()
      .required()
      .greater(Joi.ref('issueDate'))
      .max(
        Joi.ref('issueDate', {
          adjust: (date) => date.setFullYear(date.getFullYear() + 2),
        })
      )
      .messages({
        'date.greater': 'Expiry date must be after the issue date',
        'date.max': 'Permit validity cannot exceed 2 years from issue date',
        ...customErrorMessages,
      }),

    route: Joi.string()
      .required()
      .custom((value, helpers) => validateObjectId(value, helpers, 'route'))
      .external(async (value, helpers) => {
        return await validateEntityExists(value, helpers, Route, 'Route');
      })
      .messages(customErrorMessages),

    bus: Joi.string()
      .required()
      .custom((value, helpers) => validateObjectId(value, helpers, 'bus'))
      .external(async (value, helpers) => {
        return await validateEntityExists(value, helpers, Bus, 'Bus');
      })
      .messages(customErrorMessages),

    operator: Joi.string()
      .required()
      .custom((value, helpers) => validateObjectId(value, helpers, 'operator'))
      .external(async (value, helpers) => {
        try {
          const operator = await User.findOne({ _id: value, role: 'operator' });
          if (!operator) {
            return helpers.message('The selected user is not registered as an operator');
          }
          return value;
        } catch (error) {
          console.error('Error checking operator:', error);
          return helpers.message('Unable to verify operator. Please try again');
        }
      })
      .messages(customErrorMessages),

    status: Joi.string()
      .valid('active', 'expired', 'suspended')
      .default('active')
      .messages({
        'any.only': 'Status must be either active, expired, or suspended',
        ...customErrorMessages,
      }),
  }).custom(async (value, helpers) => {
    try {
      const existingPermit = await Permit.findOne({
        permitNumber: value.permitNumber,
      });
      if (existingPermit) {
        return helpers.message('This permit number is already in use. Please use a different number');
      }

      const activePermit = await Permit.findOne({
        bus: value.bus,
        status: 'active',
        expiryDate: { $gt: new Date() },
      });
      if (activePermit) {
        return helpers.message("This bus already has an active permit that hasn't expired yet");
      }

      return value;
    } catch (error) {
      console.error('Error in permit validation:', error);
      return helpers.message('Error validating permit details. Please try again');
    }
  }),
};

const permitValidationMiddleware = (req, res, next) => {
  const validationMiddleware = createValidationMiddleware(createPermitValidation);
  return validationMiddleware(req, res, next);
};

module.exports = permitValidationMiddleware;
