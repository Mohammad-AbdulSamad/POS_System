// validations/transactionLine.validation.js
import Joi from "joi";

// ✅ Common reusable pieces
const id = Joi.string().uuid().required();
const optionalId = Joi.string().uuid().optional();
const positiveNumber = Joi.number().positive();
const nonNegativeNumber = Joi.number().min(0);
const dateISO = Joi.date().iso();

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(100),
});

// ✅ Helper for date range validation
const withDateRange = (schema) =>
  schema.custom((value, helpers) => {
    if (value.startDate && value.endDate) {
      const start = new Date(value.startDate);
      const end = new Date(value.endDate);
      if (end < start) {
        return helpers.error("any.invalid", {
          message: "endDate must be greater than or equal to startDate",
        });
      }
    }
    return value;
  });

// ✅ Get all transaction lines
export const getAllTransactionLinesSchema = withDateRange(
  Joi.object({
    transactionId: optionalId,
    productId: optionalId,
    minAmount: nonNegativeNumber.optional(),
    maxAmount: nonNegativeNumber.optional(),
    startDate: dateISO.optional(),
    endDate: dateISO.optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(500).default(100),
  })
);

// ✅ Get transaction line by ID
export const getTransactionLineByIdSchema = Joi.object({
  id,
});

// ✅ Create transaction line
export const createTransactionLineSchema = Joi.object({
  transactionId: id,
  productId: id,
  unitPrice: positiveNumber.required(),
  qty: Joi.number().integer().positive().required(),
  discount: nonNegativeNumber.optional().default(0),
  taxAmount: nonNegativeNumber.optional().default(0),
});

// ✅ Update transaction line (must have at least one modifiable field)
export const updateTransactionLineSchema = Joi.object({
  id,
  unitPrice: nonNegativeNumber.optional(),
  qty: Joi.number().integer().positive().optional(),
  discount: nonNegativeNumber.optional(),
  taxAmount: nonNegativeNumber.optional(),
})
  .or("unitPrice", "qty", "discount", "taxAmount")
  .messages({
    "object.missing": "At least one field must be provided to update",
  });

// ✅ Delete transaction line
export const deleteTransactionLineSchema = Joi.object({
  id,
});

// ✅ Get lines by transaction
export const getLinesByTransactionSchema = Joi.object({
  transactionId: id,
});

// ✅ Add line to existing transaction
export const addLineToTransactionSchema = Joi.object({
  transactionId: id,
  productId: id,
  unitPrice: positiveNumber.required(),
  qty: Joi.number().integer().positive().required(),
  discount: nonNegativeNumber.optional().default(0),
  taxAmount: nonNegativeNumber.optional().default(0),
});

// ✅ Remove line from transaction
export const removeLineFromTransactionSchema = Joi.object({
  transactionId: id,
  lineId: id,
});

// ✅ Get lines by product
export const getLinesByProductSchema = withDateRange(
  Joi.object({
    productId: id,
    startDate: dateISO.optional(),
    endDate: dateISO.optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(500).default(100),
  })
);

// ✅ Get product sales stats
export const getProductSalesStatsSchema = withDateRange(
  Joi.object({
    productId: id,
    startDate: dateISO.optional(),
    endDate: dateISO.optional(),
  })
);

// ✅ Create multiple lines
export const createMultipleLinesSchema = Joi.object({
  lines: Joi.array()
    .items(
      Joi.object({
        transactionId: id,
        productId: id,
        unitPrice: positiveNumber.required(),
        qty: Joi.number().integer().positive().required(),
        discount: nonNegativeNumber.optional().default(0),
        taxAmount: nonNegativeNumber.optional().default(0),
      })
    )
    .min(1)
    .required(),
});

// ✅ Update multiple lines
export const updateMultipleLinesSchema = Joi.object({
  updates: Joi.array()
    .items(
      Joi.object({
        id: id,
        unitPrice: nonNegativeNumber.optional(),
        qty: Joi.number().integer().positive().optional(),
        discount: nonNegativeNumber.optional(),
        taxAmount: nonNegativeNumber.optional(),
      }).or("unitPrice", "qty", "discount", "taxAmount")
    )
    .min(1)
    .required(),
});

// ✅ Delete multiple lines
export const deleteMultipleLinesSchema = Joi.object({
  lineIds: Joi.array().items(id).min(1).required(),
});

// ✅ Get top selling products
export const getTopSellingProductsSchema = withDateRange(
  Joi.object({
    startDate: dateISO.optional(),
    endDate: dateISO.optional(),
    limit: Joi.number().integer().min(1).max(100).default(20),
  })
);

// ✅ Get sales by period
export const getSalesByPeriodSchema = withDateRange(
  Joi.object({
    period: Joi.string().valid("hour", "day", "month", "year").default("day"),
    startDate: dateISO.optional(),
    endDate: dateISO.optional(),
    productId: optionalId,
  })
);

// ✅ Get revenue breakdown
export const getRevenueBreakdownSchema = withDateRange(
  Joi.object({
    startDate: dateISO.optional(),
    endDate: dateISO.optional(),
    branchId: optionalId,
  })
);

// ✅ Calculate line total
export const calculateLineTotalSchema = Joi.object({
  id,
});

// ✅ Validate transaction line
export const validateTransactionLineSchema = Joi.object({
  transactionId: id,
  productId: id,
  unitPrice: positiveNumber.required(),
  qty: Joi.number().integer().positive().required(),
  discount: nonNegativeNumber.optional().default(0),
  taxAmount: nonNegativeNumber.optional().default(0),
});
