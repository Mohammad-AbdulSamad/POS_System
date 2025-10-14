// validations/return.validation.js
import Joi from "joi";

const VALID_REASONS = [
  "defective",
  "damaged",
  "wrong_item",
  "not_as_described",
  "customer_changed_mind",
  "expired",
  "quality_issue",
  "other"
];

// ✅ Return ID param validation
export const returnIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    "string.guid": "Return ID must be a valid UUID",
    "any.required": "Return ID is required"
  })
});

// ✅ Get all returns query validation
export const getAllReturnsSchema = Joi.object({
  transactionId: Joi.string().uuid().optional().messages({
    "string.guid": "Transaction ID must be a valid UUID"
  }),
  startDate: Joi.date().iso().optional().messages({
    "date.base": "Start date must be a valid ISO date"
  }),
  endDate: Joi.date().iso().min(Joi.ref("startDate")).optional().messages({
    "date.base": "End date must be a valid ISO date",
    "date.min": "End date must be after start date"
  }),
  reason: Joi.string()
    .valid(...VALID_REASONS)
    .optional()
    .messages({
      "any.only": `Reason must be one of: ${VALID_REASONS.join(", ")}`
    }),
  processedBy: Joi.string().uuid().optional().messages({
    "string.guid": "ProcessedBy must be a valid UUID"
  }),
  minAmount: Joi.number().positive().optional().messages({
    "number.base": "minAmount must be a number",
    "number.positive": "minAmount must be greater than 0"
  }),
  maxAmount: Joi.number().positive().optional().messages({
    "number.base": "maxAmount must be a number",
    "number.positive": "maxAmount must be greater than 0"
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

// ✅ Get return by ID (no query fields)
export const getReturnByIdSchema = Joi.object({});

// ✅ Create return validation
export const createReturnSchema = Joi.object({
  originalTransactionId: Joi.string().uuid().required().messages({
    "string.guid": "originalTransactionId must be a valid UUID",
    "any.required": "originalTransactionId is required"
  }),
  returnAmount: Joi.number().positive().required().messages({
    "number.base": "Return amount must be a number",
    "number.positive": "Return amount must be greater than 0",
    "any.required": "Return amount is required"
  }),
  reason: Joi.string()
    .valid(...VALID_REASONS)
    .optional()
    .allow(null, "")
    .messages({
      "any.only": `Reason must be one of: ${VALID_REASONS.join(", ")}`
    }),
  processedBy: Joi.string().uuid().optional().messages({
    "string.guid": "processedBy must be a valid UUID"
  })
});

// ✅ Update return validation
export const updateReturnSchema = Joi.object({
  returnAmount: Joi.number().positive().optional().messages({
    "number.base": "Return amount must be a number",
    "number.positive": "Return amount must be greater than 0"
  }),
  reason: Joi.string()
    .valid(...VALID_REASONS)
    .optional()
    .allow(null, "")
    .messages({
      "any.only": `Reason must be one of: ${VALID_REASONS.join(", ")}`
    }),
  processedBy: Joi.string().uuid().optional().allow(null, "").messages({
    "string.guid": "processedBy must be a valid UUID"
  })
}).min(1).messages({
  "object.min": "At least one field must be provided for update"
});

// ✅ Get returns by transaction param validation
export const getReturnsByTransactionSchema = Joi.object({
  transactionId: Joi.string().uuid().required().messages({
    "string.guid": "Transaction ID must be a valid UUID",
    "any.required": "Transaction ID is required"
  })
});

// ✅ Process return validation
export const processReturnSchema = Joi.object({
  returnAmount: Joi.number().positive().required().messages({
    "number.base": "Return amount must be a number",
    "number.positive": "Return amount must be greater than 0",
    "any.required": "Return amount is required"
  }),
  reason: Joi.string()
    .valid(...VALID_REASONS)
    .optional()
    .allow(null, "")
    .messages({
      "any.only": `Reason must be one of: ${VALID_REASONS.join(", ")}`
    }),
  processedBy: Joi.string().uuid().required().messages({
    "string.guid": "processedBy must be a valid UUID",
    "any.required": "processedBy is required"
  }),
  lineItems: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().uuid().required(),
        quantity: Joi.number().integer().positive().required()
      })
    )
    .optional()
});

// ✅ Get returns summary query validation
export const getReturnsSummarySchema = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().min(Joi.ref("startDate")).optional(),
  branchId: Joi.string().uuid().optional()
});

// ✅ Get returns by reason query validation
export const getReturnsByReasonSchema = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().min(Joi.ref("startDate")).optional()
});

// ✅ Get returns by period query validation
export const getReturnsByPeriodSchema = Joi.object({
  period: Joi.string()
    .valid("hour", "day", "week", "month")
    .default("day")
    .messages({
      "any.only": 'Period must be one of: "hour", "day", "week", or "month"'
    }),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().min(Joi.ref("startDate")).optional()
});

// ✅ Get return trends query validation
export const getReturnTrendsSchema = Joi.object({
  days: Joi.number()
    .integer()
    .min(1)
    .max(365)
    .default(30)
    .messages({
      "number.base": "Days must be a number",
      "number.min": "Days must be at least 1",
      "number.max": "Days must not exceed 365"
    })
});

// ✅ Validate return input (light pre-check schema)
export const validateReturnSchema = Joi.object({
  originalTransactionId: Joi.string().uuid().required().messages({
    "string.guid": "originalTransactionId must be a valid UUID",
    "any.required": "originalTransactionId is required"
  }),
  returnAmount: Joi.number().positive().required().messages({
    "number.base": "returnAmount must be a number",
    "number.positive": "returnAmount must be greater than 0",
    "any.required": "returnAmount is required"
  }),
  reason: Joi.string()
    .valid(...VALID_REASONS)
    .optional()
    .allow(null, "")
    .messages({
      "any.only": `Reason must be one of: ${VALID_REASONS.join(", ")}`
    })
});
