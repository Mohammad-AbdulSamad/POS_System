// validations/supplier.validation.js
import Joi from "joi";

// ✅ Supplier ID param schema
export const supplierIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    "string.guid": "Supplier ID must be a valid UUID",
    "any.required": "Supplier ID is required"
  })
});

// ✅ Get all suppliers query validation
export const getAllSuppliersSchema = Joi.object({
  include_relations: Joi.string().valid("true", "false").default("false").messages({
    "any.only": 'include_relations must be either "true" or "false"'
  }),
  search: Joi.string().trim().max(100).optional(),
  hasProducts: Joi.string().valid("true", "false").optional().messages({
    "any.only": 'hasProducts must be either "true" or "false"'
  }),
  page: Joi.number().integer().min(1).default(1).messages({
    "number.base": "Page must be a number",
    "number.min": "Page must be at least 1"
  }),
  limit: Joi.number().integer().min(1).max(200).default(50).messages({
    "number.base": "Limit must be a number",
    "number.max": "Limit must not exceed 200"
  })
});

// ✅ Get supplier by ID query validation
export const getSupplierByIdSchema = Joi.object({
  include_relations: Joi.string().valid("true", "false").default("false").messages({
    "any.only": 'include_relations must be either "true" or "false"'
  })
});

// ✅ Create supplier validation
export const createSupplierSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    "string.empty": "Supplier name cannot be empty",
    "any.required": "Supplier name is required"
  }),
  phone: Joi.string()
    .trim()
    .pattern(/^[\+]?[1-9][\d]{0,15}$/)
    .optional()
    .allow(null, "")
    .messages({
      "string.pattern.base": "Phone number must be a valid international format"
    }),
  address: Joi.string().trim().max(255).optional().allow(null, "")
});

// ✅ Update supplier validation
export const updateSupplierSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  phone: Joi.string()
    .trim()
    .pattern(/^[\+]?[1-9][\d]{0,15}$/)
    .optional()
    .allow(null, "")
    .messages({
      "string.pattern.base": "Phone number must be a valid international format"
    }),
  address: Joi.string().trim().max(255).optional().allow(null, "")
}).min(1).messages({
  "object.min": "At least one field must be provided for update"
});

// ✅ Delete supplier (same as param schema)
export const deleteSupplierSchema = supplierIdSchema;

// ✅ Get supplier products query validation
export const getSupplierProductsSchema = Joi.object({
  active: Joi.string().valid("true", "false").optional(),
  lowStock: Joi.string().valid("true", "false").optional(),
  branchId: Joi.string().uuid().optional(),
  categoryId: Joi.string().uuid().optional(),
  search: Joi.string().trim().max(100).optional(),
  sortBy: Joi.string()
    .valid("name", "sku", "priceGross", "cost", "stock", "createdAt")
    .default("name"),
  sortOrder: Joi.string().valid("asc", "desc").default("asc"),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(200).default(50)
});

// ✅ Supplier analytics validation
export const getSupplierAnalyticsSchema = supplierIdSchema;

// ✅ Get supplier reorder products validation
export const getSupplierReorderProductsSchema = Joi.object({
  branchId: Joi.string().uuid().optional(),
  limit: Joi.number().integer().min(1).max(200).default(50)
});

// ✅ Search suppliers validation
export const searchSuppliersSchema = Joi.object({
  q: Joi.string().trim().min(2).max(100).required().messages({
    "string.min": "Search query must be at least 2 characters",
    "any.required": "Search query is required"
  }),
  limit: Joi.number().integer().min(1).max(50).default(10)
});

// ✅ Assign products to supplier validation
export const assignProductsToSupplierSchema = Joi.object({
  productIds: Joi.array()
    .items(Joi.string().uuid().required())
    .min(1)
    .required()
    .messages({
      "array.base": "productIds must be an array of UUIDs",
      "array.min": "At least one product ID is required",
      "any.required": "productIds array is required"
    })
});
