// validations/product.validation.js
import Joi from 'joi';

// ✅ Validate product ID in URL params
export const productIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'Product ID must be a valid UUID',
    'any.required': 'Product ID is required'
  })
});

// ✅ Validate branch ID in URL params
export const branchIdParamSchema = Joi.object({
  branchId: Joi.string().uuid().required().messages({
    'string.guid': 'Branch ID must be a valid UUID',
    'any.required': 'Branch ID is required'
  })
});

// ✅ Validate category ID in URL params
export const categoryIdParamSchema = Joi.object({
  categoryId: Joi.string().uuid().required().messages({
    'string.guid': 'Category ID must be a valid UUID',
    'any.required': 'Category ID is required'
  })
});

// ✅ Validate barcode in URL params
export const barcodeParamSchema = Joi.object({
  barcode: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': 'Barcode is required',
    'string.min': 'Barcode must be at least 1 character',
    'string.max': 'Barcode must not exceed 100 characters',
    'any.required': 'Barcode is required'
  })
});

// ✅ Validate branch ID and SKU in URL params
export const branchSkuParamSchema = Joi.object({
  branchId: Joi.string().uuid().required().messages({
    'string.guid': 'Branch ID must be a valid UUID',
    'any.required': 'Branch ID is required'
  }),
  sku: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': 'SKU is required',
    'string.min': 'SKU must be at least 1 character',
    'string.max': 'SKU must not exceed 100 characters',
    'any.required': 'SKU is required'
  })
});

// ✅ Create product validation
export const createProductSchema = Joi.object({
  branchId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Branch ID must be a valid UUID',
      'any.required': 'Branch ID is required'
    }),
  
  sku: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.empty': 'SKU is required',
      'string.min': 'SKU must be at least 1 character',
      'string.max': 'SKU must not exceed 100 characters',
      'any.required': 'SKU is required'
    }),
  
  name: Joi.string()
    .trim()
    .min(2)
    .max(200)
    .required()
    .messages({
      'string.empty': 'Product name is required',
      'string.min': 'Product name must be at least 2 characters',
      'string.max': 'Product name must not exceed 200 characters',
      'any.required': 'Product name is required'
    }),
  
  description: Joi.string()
    .trim()
    .max(1000)
    .optional()
    .allow(null, '')
    .messages({
      'string.max': 'Description must not exceed 1000 characters'
    }),
  
  priceGross: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.base': 'Price must be a number',
      'number.positive': 'Price must be greater than 0',
      'any.required': 'Price is required'
    }),
  
  cost: Joi.number()
    .positive()
    .precision(2)
    .optional()
    .allow(null)
    .messages({
      'number.base': 'Cost must be a number',
      'number.positive': 'Cost must be greater than 0'
    }),
  
  unit: Joi.string()
    .trim()
    .max(50)
    .optional()
    .allow(null, '')
    .messages({
      'string.max': 'Unit must not exceed 50 characters'
    }),
  
  stock: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .messages({
      'number.base': 'Stock must be a number',
      'number.integer': 'Stock must be an integer',
      'number.min': 'Stock must be at least 0'
    }),
  
  categoryId: Joi.string()
    .uuid()
    .optional()
    .allow(null)
    .messages({
      'string.guid': 'Category ID must be a valid UUID'
    }),
  
  supplierId: Joi.string()
    .uuid()
    .optional()
    .allow(null)
    .messages({
      'string.guid': 'Supplier ID must be a valid UUID'
    }),
  
  taxRateId: Joi.string()
    .uuid()
    .optional()
    .allow(null)
    .messages({
      'string.guid': 'Tax Rate ID must be a valid UUID'
    }),
  
  active: Joi.boolean()
    .default(true)
    .messages({
      'boolean.base': 'Active must be a boolean'
    }),
  
  metadata: Joi.object()
    .optional()
    .allow(null)
    .messages({
      'object.base': 'Metadata must be an object'
    })
});

// ✅ Update product validation
export const updateProductSchema = Joi.object({
  sku: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'string.empty': 'SKU cannot be empty',
      'string.min': 'SKU must be at least 1 character',
      'string.max': 'SKU must not exceed 100 characters'
    }),
  
  name: Joi.string()
    .trim()
    .min(2)
    .max(200)
    .optional()
    .messages({
      'string.empty': 'Product name cannot be empty',
      'string.min': 'Product name must be at least 2 characters',
      'string.max': 'Product name must not exceed 200 characters'
    }),
  
  description: Joi.string()
    .trim()
    .max(1000)
    .optional()
    .allow(null, '')
    .messages({
      'string.max': 'Description must not exceed 1000 characters'
    }),
  
  priceGross: Joi.number()
    .positive()
    .precision(2)
    .optional()
    .messages({
      'number.base': 'Price must be a number',
      'number.positive': 'Price must be greater than 0'
    }),
  
  cost: Joi.number()
    .positive()
    .precision(2)
    .optional()
    .allow(null)
    .messages({
      'number.base': 'Cost must be a number',
      'number.positive': 'Cost must be greater than 0'
    }),
  
  unit: Joi.string()
    .trim()
    .max(50)
    .optional()
    .allow(null, '')
    .messages({
      'string.max': 'Unit must not exceed 50 characters'
    }),
  
  stock: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.base': 'Stock must be a number',
      'number.integer': 'Stock must be an integer',
      'number.min': 'Stock must be at least 0'
    }),
  
  categoryId: Joi.string()
    .uuid()
    .optional()
    .allow(null)
    .messages({
      'string.guid': 'Category ID must be a valid UUID'
    }),
  
  supplierId: Joi.string()
    .uuid()
    .optional()
    .allow(null)
    .messages({
      'string.guid': 'Supplier ID must be a valid UUID'
    }),
  
  taxRateId: Joi.string()
    .uuid()
    .optional()
    .allow(null)
    .messages({
      'string.guid': 'Tax Rate ID must be a valid UUID'
    }),
  
  active: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'Active must be a boolean'
    }),
  
  metadata: Joi.object()
    .optional()
    .allow(null)
    .messages({
      'object.base': 'Metadata must be an object'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

// ✅ Get all products query validation
export const getAllProductsSchema = Joi.object({
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
    }),
  
  branchId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.guid': 'Branch ID must be a valid UUID'
    }),
  
  active: Joi.string()
    .valid('true', 'false')
    .optional()
    .messages({
      'any.only': 'active must be either "true" or "false"'
    }),
  
  categoryId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.guid': 'Category ID must be a valid UUID'
    }),
  
  search: Joi.string()
    .trim()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Search term must not exceed 100 characters'
    }),
  
  sortBy: Joi.string()
    .valid('name', 'sku', 'priceGross', 'cost', 'stock', 'createdAt', 'updatedAt')
    .default('name')
    .messages({
      'any.only': 'sortBy must be one of: name, sku, priceGross, cost, stock, createdAt, updatedAt'
    }),
  
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('asc')
    .messages({
      'any.only': 'sortOrder must be either "asc" or "desc"'
    })
});

// ✅ Get product by barcode query validation
export const getProductByBarcodeSchema = Joi.object({
  branchId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.guid': 'Branch ID must be a valid UUID'
    })
});

// ✅ Get products by branch query validation
export const getProductsByBranchSchema = Joi.object({
  active: Joi.string()
    .valid('true', 'false')
    .default('true')
    .messages({
      'any.only': 'active must be either "true" or "false"'
    })
});

// ✅ Search products by name query validation
export const searchProductsByNameSchema = Joi.object({
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
  
  branchId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.guid': 'Branch ID must be a valid UUID'
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

// ✅ Get low stock products query validation
export const getLowStockProductsSchema = Joi.object({
  threshold: Joi.number()
    .integer()
    .min(0)
    .max(1000)
    .default(10)
    .messages({
      'number.base': 'Threshold must be a number',
      'number.integer': 'Threshold must be an integer',
      'number.min': 'Threshold must be at least 0',
      'number.max': 'Threshold must not exceed 1000'
    })
});

// ✅ Update stock validation
export const updateStockSchema = Joi.object({
  change: Joi.number()
    .integer()
    .required()
    .messages({
      'number.base': 'Stock change must be a number',
      'number.integer': 'Stock change must be an integer',
      'any.required': 'Stock change is required'
    }),
  
  reason: Joi.string()
    .valid('sale', 'purchase', 'adjustment', 'transfer', 'spoilage', 'return', 'damaged', 'manual_adjustment', 'initial_stock')
    .default('manual_adjustment')
    .messages({
      'any.only': 'Reason must be one of: sale, purchase, adjustment, transfer, spoilage, return, damaged, manual_adjustment, initial_stock'
    })
});

// ✅ Get stock history query validation
export const getStockHistorySchema = Joi.object({
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

// ✅ Update price validation
export const updatePriceSchema = Joi.object({
  priceGross: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.base': 'Price must be a number',
      'number.positive': 'Price must be greater than 0',
      'any.required': 'Price is required'
    }),
  
  cost: Joi.number()
    .positive()
    .precision(2)
    .optional()
    .messages({
      'number.base': 'Cost must be a number',
      'number.positive': 'Cost must be greater than 0'
    })
});

// ✅ Bulk update products validation
export const bulkUpdateProductsSchema = Joi.object({
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
  
  updateData: Joi.object({
    priceGross: Joi.number()
      .positive()
      .precision(2)
      .optional()
      .messages({
        'number.base': 'Price must be a number',
        'number.positive': 'Price must be greater than 0'
      }),
    
    cost: Joi.number()
      .positive()
      .precision(2)
      .optional()
      .messages({
        'number.base': 'Cost must be a number',
        'number.positive': 'Cost must be greater than 0'
      }),
    
    active: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'Active must be a boolean'
      }),
    
    categoryId: Joi.string()
      .uuid()
      .optional()
      .messages({
        'string.guid': 'Category ID must be a valid UUID'
      }),
    
    supplierId: Joi.string()
      .uuid()
      .optional()
      .messages({
        'string.guid': 'Supplier ID must be a valid UUID'
      }),
    
    taxRateId: Joi.string()
      .uuid()
      .optional()
      .messages({
        'string.guid': 'Tax Rate ID must be a valid UUID'
      })
  })
    .min(1)
    .required()
    .messages({
      'object.min': 'At least one field must be provided in updateData',
      'any.required': 'Update data is required'
    })
});