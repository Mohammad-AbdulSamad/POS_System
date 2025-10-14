// validations/stockMovement.validation.js
import Joi from "joi";

// ✅ Valid movement reasons
export const VALID_REASONS = [
  "sale",
  "purchase",
  "adjustment",
  "transfer",
  "spoilage",
  "return",
  "damaged"
];

// ✅ Movement ID param validation
export const stockMovementIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    "string.guid": "Stock Movement ID must be a valid UUID",
    "any.required": "Stock Movement ID is required"
  })
});

// ✅ Get all stock movements query validation
export const getAllStockMovementsSchema = Joi.object({
  branchId: Joi.string().uuid().optional().messages({
    "string.guid": "Branch ID must be a valid UUID"
  }),
  productId: Joi.string().uuid().optional().messages({
    "string.guid": "Product ID must be a valid UUID"
  }),
  reason: Joi.string()
    .valid(...VALID_REASONS)
    .optional()
    .messages({
      "any.only": `Reason must be one of: ${VALID_REASONS.join(", ")}`
    }),
  startDate: Joi.date().iso().optional().messages({
    "date.base": "Start date must be a valid ISO date"
  }),
  endDate: Joi.date().iso().min(Joi.ref("startDate")).optional().messages({
    "date.base": "End date must be a valid ISO date",
    "date.min": "End date must be after start date"
  }),
  minQty: Joi.number().integer().optional().messages({
    "number.base": "minQty must be a number"
  }),
  maxQty: Joi.number().integer().optional().messages({
    "number.base": "maxQty must be a number"
  }),
  page: Joi.number().integer().min(1).default(1).messages({
    "number.base": "Page must be a number",
    "number.min": "Page must be at least 1"
  }),
  limit: Joi.number().integer().min(1).max(200).default(100).messages({
    "number.base": "Limit must be a number",
    "number.max": "Limit must not exceed 200"
  })
});

// ✅ Get stock movement by ID query validation
export const getStockMovementByIdSchema = Joi.object({
  include_relations: Joi.string().valid("true", "false").default("false").messages({
    "any.only": 'include_relations must be either "true" or "false"'
  })
});

// ✅ Create stock movement validation
export const createStockMovementSchema = Joi.object({
  productId: Joi.string().uuid().required().messages({
    "string.guid": "Product ID must be a valid UUID",
    "any.required": "Product ID is required"
  }),
  branchId: Joi.string().uuid().required().messages({
    "string.guid": "Branch ID must be a valid UUID",
    "any.required": "Branch ID is required"
  }),
  quantity: Joi.number().integer().required().messages({
    "number.base": "Quantity must be a number",
    "any.required": "Quantity is required"
  }),
  reason: Joi.string()
    .valid(...VALID_REASONS)
    .required()
    .messages({
      "any.only": `Reason must be one of: ${VALID_REASONS.join(", ")}`,
      "any.required": "Reason is required"
    }),
  referenceId: Joi.string().uuid().optional().allow(null, "").messages({
    "string.guid": "Reference ID must be a valid UUID"
  }),
  notes: Joi.string().trim().max(500).optional().allow(null, "").messages({
    "string.max": "Notes must not exceed 500 characters"
  }),
  processedBy: Joi.string().uuid().optional().allow(null, "").messages({
    "string.guid": "ProcessedBy must be a valid UUID"
  })
});

// ✅ Update stock movement validation
export const updateStockMovementSchema = Joi.object({
  quantity: Joi.number().integer().optional(),
  reason: Joi.string().valid(...VALID_REASONS).optional(),
  notes: Joi.string().trim().max(500).optional().allow(null, ""),
  referenceId: Joi.string().uuid().optional().allow(null, ""),
  processedBy: Joi.string().uuid().optional().allow(null, "")
}).min(1).messages({
  "object.min": "At least one field must be provided for update"
});

// ✅ Delete stock movement validation (same param as ID)
export const deleteStockMovementSchema = stockMovementIdSchema;

// ✅ Get movements by product query validation
export const getMovementsByProductSchema = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().min(Joi.ref("startDate")).optional(),
  branchId: Joi.string().uuid().optional(),
  reason: Joi.string().valid(...VALID_REASONS).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(200).default(100)
});

// ✅ Get product stock history query validation
export const getProductStockHistorySchema = Joi.object({
  branchId: Joi.string().uuid().optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().min(Joi.ref("startDate")).optional(),
  include_zero: Joi.string().valid("true", "false").default("false")
});

// ✅ Get movements by branch query validation
export const getMovementsByBranchSchema = Joi.object({
  productId: Joi.string().uuid().optional(),
  reason: Joi.string().valid(...VALID_REASONS).optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().min(Joi.ref("startDate")).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(200).default(100)
});

// ✅ Bulk stock adjustment validation
export const bulkStockAdjustmentSchema = Joi.object({
  adjustments: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().uuid().required(),
        branchId: Joi.string().uuid().required(),
        quantity: Joi.number().integer().required(),
        reason: Joi.string()
          .valid("adjustment", "damaged", "spoilage", "return")
          .required()
      })
    )
    .min(1)
    .required()
    .messages({
      "array.base": "Adjustments must be an array",
      "array.min": "At least one adjustment is required"
    }),
  processedBy: Joi.string().uuid().optional()
});

// ✅ Get stock velocity query validation
export const getStockVelocitySchema = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().min(Joi.ref("startDate")).optional(),
  branchId: Joi.string().uuid().optional(),
  productId: Joi.string().uuid().optional(),
  top: Joi.number().integer().min(1).max(100).default(10)
});

// ✅ Get turnover rate query validation
export const getTurnoverRateSchema = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().min(Joi.ref("startDate")).optional(),
  branchId: Joi.string().uuid().optional(),
  categoryId: Joi.string().uuid().optional()
});

// ✅ Get low stock products query validation
export const getLowStockProductsSchema = Joi.object({
  branchId: Joi.string().uuid().optional(),
  threshold: Joi.number().integer().min(1).default(10),
  include_inactive: Joi.string().valid("true", "false").default("false")
});

// ✅ Get movement trends query validation
export const getMovementTrendsSchema = Joi.object({
  days: Joi.number().integer().min(1).max(365).default(30),
  branchId: Joi.string().uuid().optional(),
  reason: Joi.string().valid(...VALID_REASONS).optional()
});

// ✅ Get movement summary query validation
export const getMovementSummarySchema = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().min(Joi.ref("startDate")).optional(),
  branchId: Joi.string().uuid().optional(),
  productId: Joi.string().uuid().optional()
});

// ✅ Get movement analytics query validation
export const getMovementAnalyticsSchema = Joi.object({
  period: Joi.number().integer().min(1).max(365).default(30),
  branchId: Joi.string().uuid().optional()
});

// ✅ Get recent movements query validation
export const getRecentMovementsSchema = Joi.object({
  branchId: Joi.string().uuid().optional(),
  limit: Joi.number().integer().min(1).max(100).default(20)
});
