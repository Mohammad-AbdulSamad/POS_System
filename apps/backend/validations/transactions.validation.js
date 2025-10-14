// validations/transaction.validation.js
import Joi from "joi";

// ✅ Common reusable pieces
const id = Joi.string().uuid().required();
const optionalId = Joi.string().uuid().optional();
const positiveNumber = Joi.number().positive();
const nonNegativeNumber = Joi.number().min(0);
const dateISO = Joi.date().iso();

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(50),
});

// ✅ Date range helper
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

// ✅ Line and payment sub-schemas
const lineSchema = Joi.object({
  productId: id,
  qty: Joi.number().integer().positive().required(),
  unitPrice: positiveNumber.required(),
  discount: nonNegativeNumber.optional().default(0),
  taxAmount: nonNegativeNumber.optional().default(0),
});

const paymentSchema = Joi.object({
  method: Joi.string().trim().max(50).required(),
  amount: nonNegativeNumber.required(),
});

// ✅ getAllTransactions
export const getAllTransactionsSchema = withDateRange(
  Joi.object({
    include_relations: Joi.string().valid("true", "false").default("false"),
    branchId: optionalId,
    status: Joi.string()
      .valid("PENDING", "COMPLETED", "CANCELLED")
      .optional(),
    startDate: dateISO.optional(),
    endDate: dateISO.optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(500).default(50),
  })
);

// ✅ getTransactionById
export const getTransactionByIdSchema = Joi.object({
  id,
  include_relations: Joi.string().valid("true", "false").optional(),
});

// ✅ createTransaction
export const createTransactionSchema = Joi.object({
  branchId: id,
  cashierId: optionalId,
  customerId: optionalId,
  lines: Joi.array().items(lineSchema).min(1).required(),
  payments: Joi.array().items(paymentSchema).optional(),
  loyaltyPointsEarned: Joi.number().integer().min(0).default(0),
  loyaltyPointsUsed: Joi.number().integer().min(0).default(0),
  metadata: Joi.object().unknown(true).optional(),
});

// ✅ updateTransaction (must have at least one editable field)
export const updateTransactionSchema = Joi.object({
  id,
  status: Joi.string()
    .valid("PENDING", "COMPLETED", "CANCELLED")
    .optional(),
  metadata: Joi.object().unknown(true).optional(),
})
  .or("status", "metadata")
  .messages({
    "object.missing": "At least one of status or metadata must be provided for update",
  });

// ✅ deleteTransaction
export const deleteTransactionSchema = Joi.object({
  id,
});

// ✅ getTransactionsByBranch
export const getTransactionsByBranchSchema = withDateRange(
  Joi.object({
    branchId: id,
    startDate: dateISO.optional(),
    endDate: dateISO.optional(),
    status: Joi.string()
      .valid("PENDING", "COMPLETED", "CANCELLED")
      .optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(500).default(100),
  })
);

// ✅ getTransactionsByCustomer
export const getTransactionsByCustomerSchema = Joi.object({
  customerId: id,
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(50),
});

// ✅ getTransactionReceipt
export const getTransactionReceiptSchema = Joi.object({
  id,
});
