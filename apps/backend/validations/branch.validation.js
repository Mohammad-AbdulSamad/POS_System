// validations/branch.validation.js
import Joi from 'joi';

// ✅ Validate branch ID in URL params
export const branchIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'Branch ID must be a valid UUID',
    'any.required': 'Branch ID is required'
  })
});

// ✅ Create branch validation
export const createBranchSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Branch name is required',
      'string.min': 'Branch name must be at least 2 characters',
      'string.max': 'Branch name must not exceed 100 characters',
      'any.required': 'Branch name is required'
    }),
  
  address: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow(null, '')
    .messages({
      'string.max': 'Address must not exceed 500 characters'
    }),
  
  phone: Joi.string()
    .trim()
    .pattern(/^[0-9+\-\s()]+$/)
    .min(7)
    .max(20)
    .optional()
    .allow(null, '')
    .messages({
      'string.pattern.base': 'Phone number must contain only numbers, +, -, spaces, and parentheses',
      'string.min': 'Phone number must be at least 7 characters',
      'string.max': 'Phone number must not exceed 20 characters'
    })
});

// ✅ Update branch validation (all fields optional)
export const updateBranchSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.empty': 'Branch name cannot be empty',
      'string.min': 'Branch name must be at least 2 characters',
      'string.max': 'Branch name must not exceed 100 characters'
    }),
  
  address: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow(null, '')
    .messages({
      'string.max': 'Address must not exceed 500 characters'
    }),
  
  phone: Joi.string()
    .trim()
    .pattern(/^[0-9+\-\s()]+$/)
    .min(7)
    .max(20)
    .optional()
    .allow(null, '')
    .messages({
      'string.pattern.base': 'Phone number must contain only numbers, +, -, spaces, and parentheses',
      'string.min': 'Phone number must be at least 7 characters',
      'string.max': 'Phone number must not exceed 20 characters'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

// ✅ Get all branches query validation
export const getAllBranchesSchema = Joi.object({
  include_relations: Joi.string()
    .valid('true', 'false')
    .default('false')
    .messages({
      'any.only': 'include_relations must be either "true" or "false"'
    })
});

// ✅ Get branch by ID query validation
export const getBranchByIdSchema = Joi.object({
  include_relations: Joi.string()
    .valid('true', 'false')
    .default('false')
    .messages({
      'any.only': 'include_relations must be either "true" or "false"'
    })
});

// ✅ Get branch products query validation
export const getBranchProductsSchema = Joi.object({
  categoryId: Joi.string().uuid().optional().messages({
    'string.guid': 'Category ID must be a valid UUID'
  }),
  
  active: Joi.string()
    .valid('true', 'false')
    .optional()
    .messages({
      'any.only': 'active must be either "true" or "false"'
    }),
  
  lowStock: Joi.string()
    .valid('true', 'false')
    .optional()
    .messages({
      'any.only': 'lowStock must be either "true" or "false"'
    }),
  
  search: Joi.string()
    .trim()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Search term must not exceed 100 characters'
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

// ✅ Get branch transactions query validation
export const getBranchTransactionsSchema = Joi.object({
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
    .default(100)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must not exceed 100'
    })
});

// ✅ Get branch stock movements query validation
export const getBranchStockMovementsSchema = Joi.object({
  reason: Joi.string()
    .valid('sale', 'purchase', 'adjustment', 'transfer', 'spoilage', 'return', 'damaged')
    .optional()
    .messages({
      'any.only': 'Reason must be one of: sale, purchase, adjustment, transfer, spoilage, return, damaged'
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
  
  productId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.guid': 'Product ID must be a valid UUID'
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
    .default(100)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must not exceed 100'
    })
});

// ✅ Get branch analytics query validation
export const getBranchAnalyticsSchema = Joi.object({
  period: Joi.number()
    .integer()
    .min(1)
    .max(365)
    .default(30)
    .messages({
      'number.base': 'Period must be a number',
      'number.integer': 'Period must be an integer',
      'number.min': 'Period must be at least 1 day',
      'number.max': 'Period must not exceed 365 days'
    })
});