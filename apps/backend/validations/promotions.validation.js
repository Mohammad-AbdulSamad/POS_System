// validations/promotion.validation.js
import Joi from "joi";

// ✅ Promotion ID param validation
export const promotionIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    "string.guid": "Promotion ID must be a valid UUID",
    "any.required": "Promotion ID is required"
  })
});

// ✅ Get all promotions query validation
export const getAllPromotionsSchema = Joi.object({
  include_relations: Joi.string()
    .valid("true", "false")
    .default("false")
    .messages({
      "any.only": 'include_relations must be either "true" or "false"'
    }),

  type: Joi.string()
    .valid("PERCENTAGE", "FIXED_AMOUNT", "BUY_X_GET_Y")
    .optional()
    .messages({
      "any.only": "Type must be PERCENTAGE, FIXED_AMOUNT, or BUY_X_GET_Y"
    }),

  active: Joi.string()
    .valid("true", "false")
    .optional()
    .messages({
      "any.only": 'active must be either "true" or "false"'
    }),

  search: Joi.string()
    .trim()
    .max(100)
    .optional()
    .messages({
      "string.max": "Search term must not exceed 100 characters"
    }),

  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      "number.base": "Page must be a number",
      "number.min": "Page must be at least 1"
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(50)
    .messages({
      "number.base": "Limit must be a number",
      "number.max": "Limit must not exceed 100"
    })
});

// ✅ Get promotion by ID query validation
export const getPromotionByIdSchema = Joi.object({
  include_relations: Joi.string()
    .valid("true", "false")
    .default("false")
    .messages({
      "any.only": 'include_relations must be either "true" or "false"'
    })
});

// ✅ Create promotion validation
export const createPromotionSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(150)
    .required()
    .messages({
      "string.empty": "Promotion name is required",
      "string.min": "Promotion name must be at least 2 characters",
      "string.max": "Promotion name must not exceed 150 characters",
      "any.required": "Promotion name is required"
    }),

  description: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow(null, "")
    .messages({
      "string.max": "Description must not exceed 500 characters"
    }),

  type: Joi.string()
    .valid("PERCENTAGE", "FIXED_AMOUNT", "BUY_X_GET_Y")
    .default("PERCENTAGE")
    .messages({
      "any.only": "Type must be PERCENTAGE, FIXED_AMOUNT, or BUY_X_GET_Y"
    }),

  discountPct: Joi.number()
    .when("type", {
      is: "PERCENTAGE",
      then: Joi.number().positive().max(100).required(),
      otherwise: Joi.number().allow(null)
    })
    .messages({
      "number.base": "Discount percentage must be a number",
      "number.max": "Percentage discount must not exceed 100",
      "any.required": "Discount percentage is required for PERCENTAGE promotions"
    }),

  discountAmt: Joi.number()
    .when("type", {
      is: "FIXED_AMOUNT",
      then: Joi.number().positive().required(),
      otherwise: Joi.number().allow(null)
    })
    .messages({
      "number.base": "Discount amount must be a number",
      "any.required": "Discount amount is required for FIXED_AMOUNT promotions"
    }),

  buyQty: Joi.number()
    .integer()
    .positive()
    .when("type", {
      is: "BUY_X_GET_Y",
      then: Joi.required(),
      otherwise: Joi.allow(null)
    })
    .messages({
      "number.base": "Buy quantity must be a number",
      "any.required": "Buy quantity is required for BUY_X_GET_Y promotions"
    }),

  getQty: Joi.number()
    .integer()
    .positive()
    .when("type", {
      is: "BUY_X_GET_Y",
      then: Joi.required(),
      otherwise: Joi.allow(null)
    })
    .messages({
      "number.base": "Get quantity must be a number",
      "any.required": "Get quantity is required for BUY_X_GET_Y promotions"
    }),

  active: Joi.boolean().default(true)
});

// ✅ Update promotion validation
export const updatePromotionSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150).optional(),
  description: Joi.string().trim().max(500).optional().allow(null, ""),
  type: Joi.string()
    .valid("PERCENTAGE", "FIXED_AMOUNT", "BUY_X_GET_Y")
    .optional()
    .messages({
      "any.only": "Type must be PERCENTAGE, FIXED_AMOUNT, or BUY_X_GET_Y"
    }),
  discountPct: Joi.number().positive().max(100).optional(),
  discountAmt: Joi.number().positive().optional(),
  buyQty: Joi.number().integer().positive().optional(),
  getQty: Joi.number().integer().positive().optional(),
  active: Joi.boolean().optional()
}).min(1).messages({
  "object.min": "At least one field must be provided for update"
});

// ✅ Calculate discount validation
export const calculateDiscountSchema = Joi.object({
  promotionId: Joi.string().uuid().required().messages({
    "string.guid": "Promotion ID must be a valid UUID",
    "any.required": "Promotion ID is required"
  }),
  originalPrice: Joi.number().positive().required().messages({
    "number.base": "Original price must be a valid number",
    "any.required": "Original price is required"
  }),
  quantity: Joi.number().integer().positive().default(1).messages({
    "number.base": "Quantity must be a number",
    "number.min": "Quantity must be greater than 0"
  })
});

// ✅ Assign products validation
export const assignProductsToPromotionSchema = Joi.object({
  productIds: Joi.array()
    .items(Joi.string().uuid().messages({ "string.guid": "Each product ID must be a valid UUID" }))
    .min(1)
    .required()
    .messages({
      "array.base": "Product IDs must be an array",
      "array.min": "At least one product ID is required",
      "any.required": "Product IDs array is required"
    })
});

// ✅ Assign categories validation
export const assignCategoriesToPromotionSchema = Joi.object({
  categoryIds: Joi.array()
    .items(Joi.string().uuid().messages({ "string.guid": "Each category ID must be a valid UUID" }))
    .min(1)
    .required()
    .messages({
      "array.base": "Category IDs must be an array",
      "array.min": "At least one category ID is required",
      "any.required": "Category IDs array is required"
    })
});

// ✅ Get promotion products query validation
export const getPromotionProductsSchema = Joi.object({
  active: Joi.string()
    .valid("true", "false")
    .optional()
    .messages({
      "any.only": 'active must be either "true" or "false"'
    }),
  branchId: Joi.string().uuid().optional().messages({
    "string.guid": "Branch ID must be a valid UUID"
  }),
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      "number.base": "Page must be a number",
      "number.min": "Page must be at least 1"
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(50)
    .messages({
      "number.base": "Limit must be a number",
      "number.max": "Limit must not exceed 100"
    })
});
