// validations/customer.validation.js
import Joi from 'joi';

// ✅ Validate customer ID in URL params
export const customerIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'Customer ID must be a valid UUID',
    'any.required': 'Customer ID is required'
  })
});

// ✅ Create customer validation
export const createCustomerSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Customer name is required',
      'string.min': 'Customer name must be at least 2 characters',
      'string.max': 'Customer name must not exceed 100 characters',
      'any.required': 'Customer name is required'
    }),
  
  phone: Joi.string()
    .trim()
    .pattern(/^[\+]?[1-9][\d\s]{0,15}$/)
    .optional()
    .allow(null, '')
    .messages({
      'string.pattern.base': 'Invalid phone format'
    }),
  
  email: Joi.string()
    .trim()
    .email()
    .max(100)
    .optional()
    .allow(null, '')
    .messages({
      'string.email': 'Invalid email format',
      'string.max': 'Email must not exceed 100 characters'
    }),
  
  loyaltyNumber: Joi.string()
    .trim()
    .min(5)
    .max(50)
    .optional()
    .messages({
      'string.min': 'Loyalty number must be at least 5 characters',
      'string.max': 'Loyalty number must not exceed 50 characters'
    }),
  
  loyaltyTier: Joi.string()
    .valid('BRONZE', 'SILVER', 'GOLD', 'PLATINUM')
    .default('BRONZE')
    .messages({
      'any.only': 'Loyalty tier must be one of: BRONZE, SILVER, GOLD, PLATINUM'
    }),
  
  dateOfBirth: Joi.date()
    .iso()
    .max('now')
    .optional()
    .allow(null)
    .messages({
      'date.base': 'Date of birth must be a valid date',
      'date.format': 'Date of birth must be in ISO format',
      'date.max': 'Date of birth cannot be in the future'
    }),
  
  preferredStore: Joi.string()
    .trim()
    .max(100)
    .optional()
    .allow(null, '')
    .messages({
      'string.max': 'Preferred store must not exceed 100 characters'
    })
});

// ✅ Update customer validation
export const updateCustomerSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.empty': 'Customer name cannot be empty',
      'string.min': 'Customer name must be at least 2 characters',
      'string.max': 'Customer name must not exceed 100 characters'
    }),
  
  phone: Joi.string()
    .trim()
    .pattern(/^[\+]?[1-9][\d\s]{0,15}$/)
    .optional()
    .allow(null, '')
    .messages({
      'string.pattern.base': 'Invalid phone format'
    }),
  
  email: Joi.string()
    .trim()
    .email()
    .max(100)
    .optional()
    .allow(null, '')
    .messages({
      'string.email': 'Invalid email format',
      'string.max': 'Email must not exceed 100 characters'
    }),
  
  loyaltyNumber: Joi.string()
    .trim()
    .min(5)
    .max(50)
    .optional()
    .messages({
      'string.min': 'Loyalty number must be at least 5 characters',
      'string.max': 'Loyalty number must not exceed 50 characters'
    }),
  
  loyaltyTier: Joi.string()
    .valid('BRONZE', 'SILVER', 'GOLD', 'PLATINUM')
    .optional()
    .messages({
      'any.only': 'Loyalty tier must be one of: BRONZE, SILVER, GOLD, PLATINUM'
    }),
  
  dateOfBirth: Joi.date()
    .iso()
    .max('now')
    .optional()
    .allow(null)
    .messages({
      'date.base': 'Date of birth must be a valid date',
      'date.format': 'Date of birth must be in ISO format',
      'date.max': 'Date of birth cannot be in the future'
    }),
  
  preferredStore: Joi.string()
    .trim()
    .max(100)
    .optional()
    .allow(null, '')
    .messages({
      'string.max': 'Preferred store must not exceed 100 characters'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

// ✅ Get all customers query validation
export const getAllCustomersSchema = Joi.object({
  include_relations: Joi.string()
    .valid('true', 'false')
    .default('false')
    .messages({
      'any.only': 'include_relations must be either "true" or "false"'
    }),
  
  loyaltyTier: Joi.string()
    .valid('BRONZE', 'SILVER', 'GOLD', 'PLATINUM')
    .optional()
    .messages({
      'any.only': 'Loyalty tier must be one of: BRONZE, SILVER, GOLD, PLATINUM'
    }),
  
  search: Joi.string()
    .trim()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Search term must not exceed 100 characters'
    }),
  
  hasTransactions: Joi.string()
    .valid('true', 'false')
    .optional()
    .messages({
      'any.only': 'hasTransactions must be either "true" or "false"'
    }),
  
  minLoyaltyPoints: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.base': 'Minimum loyalty points must be a number',
      'number.integer': 'Minimum loyalty points must be an integer',
      'number.min': 'Minimum loyalty points must be at least 0'
    }),
  
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1'
    }),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(50)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must not exceed 100'
    })
});

// ✅ Get customer by ID query validation
export const getCustomerByIdSchema = Joi.object({
  include_relations: Joi.string()
    .valid('true', 'false')
    .default('false')
    .messages({
      'any.only': 'include_relations must be either "true" or "false"'
    })
});

// ✅ Get customer transactions query validation
export const getCustomerTransactionsSchema = Joi.object({
  startDate: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.base': 'Start date must be a valid date',
      'date.format': 'Start date must be in ISO format'
    }),
  
  endDate: Joi.date()
    .iso()
    .min(Joi.ref('startDate'))
    .optional()
    .messages({
      'date.base': 'End date must be a valid date',
      'date.format': 'End date must be in ISO format',
      'date.min': 'End date must be after start date'
    }),
  
  status: Joi.string()
    .valid('PENDING', 'COMPLETED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED')
    .optional()
    .messages({
      'any.only': 'Status must be one of: PENDING, COMPLETED, CANCELLED, REFUNDED, PARTIALLY_REFUNDED'
    }),
  
  branchId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.guid': 'Branch ID must be a valid UUID'
    }),
  
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1'
    }),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(50)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must not exceed 100'
    })
});

// ✅ Get customer loyalty history query validation
export const getCustomerLoyaltyHistorySchema = Joi.object({
  type: Joi.string()
    .valid('EARNED', 'REDEEMED', 'ADJUSTMENT')
    .optional()
    .messages({
      'any.only': 'Type must be one of: EARNED, REDEEMED, ADJUSTMENT'
    }),
  
  reason: Joi.string()
    .trim()
    .max(200)
    .optional()
    .messages({
      'string.max': 'Reason must not exceed 200 characters'
    }),
  
  startDate: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.base': 'Start date must be a valid date',
      'date.format': 'Start date must be in ISO format'
    }),
  
  endDate: Joi.date()
    .iso()
    .min(Joi.ref('startDate'))
    .optional()
    .messages({
      'date.base': 'End date must be a valid date',
      'date.format': 'End date must be in ISO format',
      'date.min': 'End date must be after start date'
    }),
  
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1'
    }),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(50)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must not exceed 100'
    })
});

// ✅ Update customer loyalty points validation
export const updateCustomerLoyaltyPointsSchema = Joi.object({
  points: Joi.number()
    .integer()
    .required()
    .messages({
      'number.base': 'Points must be a number',
      'number.integer': 'Points must be an integer',
      'any.required': 'Points are required'
    }),
  
  reason: Joi.string()
    .trim()
    .min(3)
    .max(200)
    .required()
    .messages({
      'string.empty': 'Reason is required',
      'string.min': 'Reason must be at least 3 characters',
      'string.max': 'Reason must not exceed 200 characters',
      'any.required': 'Reason is required'
    }),
  
  type: Joi.string()
    .valid('EARNED', 'REDEEMED', 'ADJUSTMENT')
    .default('ADJUSTMENT')
    .messages({
      'any.only': 'Type must be one of: EARNED, REDEEMED, ADJUSTMENT'
    })
});

// ✅ Get customer analytics query validation
export const getCustomerAnalyticsSchema = Joi.object({
  period: Joi.number()
    .integer()
    .min(1)
    .max(365)
    .default(365)
    .messages({
      'number.base': 'Period must be a number',
      'number.integer': 'Period must be an integer',
      'number.min': 'Period must be at least 1 day',
      'number.max': 'Period must not exceed 365 days'
    })
});

// ✅ Search customers query validation
export const searchCustomersSchema = Joi.object({
  q: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Search query is required',
      'string.min': 'Search query must be at least 2 characters',
      'string.max': 'Search query must not exceed 100 characters',
      'any.required': 'Search query is required'
    }),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .default(10)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must not exceed 50'
    })
});