// validations/taxRate.validation.js
import Joi from "joi";

// ✅ Tax rate ID param schema
export const taxRateIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    "string.guid": "Tax Rate ID must be a valid UUID",
    "any.required": "Tax Rate ID is required"
  })
});

// ✅ Get all tax rates query validation
export const getAllTaxRatesSchema = Joi.object({
  include_relations: Joi.string().valid("true", "false").default("false").messages({
    "any.only": 'include_relations must be either "true" or "false"'
  }),
  search: Joi.string().trim().max(100).optional(),
  minRate: Joi.number().min(0).max(100).optional().messages({
    "number.base": "minRate must be a number between 0 and 100"
  }),
  maxRate: Joi.number().min(0).max(100).optional().messages({
    "number.base": "maxRate must be a number between 0 and 100"
  }),
  hasProducts: Joi.string().valid("true", "false").optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(200).default(50)
}).custom((value, helpers) => {
  if (value.minRate && value.maxRate && value.minRate > value.maxRate) {
    return helpers.error("any.invalid", {
      message: "minRate cannot be greater than maxRate"
    });
  }
  return value;
}).messages({
  "any.invalid": "{{#message}}"
});

// ✅ Get tax rate by ID query validation
export const getTaxRateByIdSchema = Joi.object({
  include_relations: Joi.string().valid("true", "false").default("false")
});

// ✅ Create tax rate validation
export const createTaxRateSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    "string.empty": "Tax rate name cannot be empty",
    "any.required": "Tax rate name is required"
  }),
  rate: Joi.number().min(0).max(100).required().messages({
    "number.base": "Rate must be a number between 0 and 100",
    "number.min": "Rate cannot be less than 0",
    "number.max": "Rate cannot exceed 100",
    "any.required": "Rate percentage is required"
  })
});

// ✅ Update tax rate validation
export const updateTaxRateSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  rate: Joi.number().min(0).max(100).optional()
}).min(1).messages({
  "object.min": "At least one field must be provided for update"
});

// ✅ Delete tax rate (same param schema)
export const deleteTaxRateSchema = taxRateIdSchema;

// ✅ Get tax rate products query validation
export const getTaxRateProductsSchema = Joi.object({
  active: Joi.string().valid("true", "false").optional(),
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

// ✅ Calculate tax validation
export const calculateTaxSchema = Joi.object({
  amount: Joi.number().min(0).required().messages({
    "number.base": "Amount must be a number",
    "number.min": "Amount must be positive or zero",
    "any.required": "Amount is required"
  }),
  taxRateId: Joi.string().uuid().required().messages({
    "string.guid": "Tax Rate ID must be a valid UUID",
    "any.required": "Tax Rate ID is required"
  })
});

// ✅ Assign products to tax rate validation
export const assignProductsToTaxRateSchema = Joi.object({
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

// ✅ Tax rate analytics (only needs param ID)
export const getTaxRateAnalyticsSchema = taxRateIdSchema;
