// validations/category.validation.js
import Joi from 'joi';

// ✅ Validate category ID in URL params
export const categoryIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'Category ID must be a valid UUID',
    'any.required': 'Category ID is required'
  })
});

// ✅ Validate branch ID in URL params
export const branchIdParamSchema = Joi.object({
  branchId: Joi.string().uuid().required().messages({
    'string.guid': 'Branch ID must be a valid UUID',
    'any.required': 'Branch ID is required'
  })
});

// ✅ Create category validation
export const createCategorySchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Category name is required',
      'string.min': 'Category name must be at least 2 characters',
      'string.max': 'Category name must not exceed 100 characters',
      'any.required': 'Category name is required'
    }),
  
  branchId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Branch ID must be a valid UUID',
      'any.required': 'Branch ID is required'
    })
});

// ✅ Update category validation
export const updateCategorySchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.empty': 'Category name cannot be empty',
      'string.min': 'Category name must be at least 2 characters',
      'string.max': 'Category name must not exceed 100 characters'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

// ✅ Get all categories query validation
export const getAllCategoriesSchema = Joi.object({
  include_relations: Joi.string()
    .valid('true', 'false')
    .default('false')
    .messages({
      'any.only': 'include_relations must be either "true" or "false"'
    }),
  
  branchId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.guid': 'Branch ID must be a valid UUID'
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
    .default(100)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must not exceed 100'
    })
});

// ✅ Get category by ID query validation
export const getCategoryByIdSchema = Joi.object({
  include_relations: Joi.string()
    .valid('true', 'false')
    .default('false')
    .messages({
      'any.only': 'include_relations must be either "true" or "false"'
    })
});

// ✅ Get categories by branch query validation
export const getCategoriesByBranchSchema = Joi.object({
  include_products: Joi.string()
    .valid('true', 'false')
    .default('false')
    .messages({
      'any.only': 'include_products must be either "true" or "false"'
    }),
  
  active_only: Joi.string()
    .valid('true', 'false')
    .default('false')
    .messages({
      'any.only': 'active_only must be either "true" or "false"'
    })
});

// ✅ Get category products query validation
export const getCategoryProductsSchema = Joi.object({
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
  
  sortBy: Joi.string()
    .valid('name', 'sku', 'priceGross', 'stock', 'createdAt')
    .default('name')
    .messages({
      'any.only': 'sortBy must be one of: name, sku, priceGross, stock, createdAt'
    }),
  
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('asc')
    .messages({
      'any.only': 'sortOrder must be either "asc" or "desc"'
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

// ✅ Move products to category validation
export const moveProductsToCategorySchema = Joi.object({
  productIds: Joi.array()
    .items(Joi.string().uuid())
    .min(1)
    .required()
    .messages({
      'array.base': 'Product IDs must be an array',
      'array.min': 'At least one product ID is required',
      'string.guid': 'Each product ID must be a valid UUID',
      'any.required': 'Product IDs are required'
    }),
  
  targetCategoryId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Target category ID must be a valid UUID',
      'any.required': 'Target category ID is required'
    })
});

// ✅ Duplicate category validation
export const duplicateCategorySchema = Joi.object({
  newName: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'New category name is required',
      'string.min': 'New category name must be at least 2 characters',
      'string.max': 'New category name must not exceed 100 characters',
      'any.required': 'New category name is required'
    }),
  
  includeProducts: Joi.boolean()
    .default(false)
    .messages({
      'boolean.base': 'includeProducts must be a boolean'
    })
});