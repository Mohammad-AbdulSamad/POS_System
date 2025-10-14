// validations/payment.validation.js
import Joi from 'joi';

// ✅ Validate payment ID in URL params
export const paymentIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'Payment ID must be a valid UUID',
    'any.required': 'Payment ID is required'
  })
});

// ✅ Validate transaction ID in URL params
export const transactionIdParamSchema = Joi.object({
  transactionId: Joi.string().uuid().required().messages({
    'string.guid': 'Transaction ID must be a valid UUID',
    'any.required': 'Transaction ID is required'
  })
});

// ✅ Create payment validation
export const createPaymentSchema = Joi.object({
  transactionId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Transaction ID must be a valid UUID',
      'any.required': 'Transaction ID is required'
    }),
  
  method: Joi.string()
    .valid('CASH', 'CARD', 'MOBILE')
    .required()
    .messages({
      'any.only': 'Payment method must be one of: CASH, CARD, MOBILE',
      'any.required': 'Payment method is required'
    }),
  
  amount: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.base': 'Amount must be a number',
      'number.positive': 'Amount must be greater than 0',
      'any.required': 'Amount is required'
    })
});

// ✅ Update payment validation
export const updatePaymentSchema = Joi.object({
  amount: Joi.number()
    .positive()
    .precision(2)
    .optional()
    .messages({
      'number.base': 'Amount must be a number',
      'number.positive': 'Amount must be greater than 0'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

// ✅ Get all payments query validation
export const getAllPaymentsSchema = Joi.object({
  include_relations: Joi.string()
    .valid('true', 'false')
    .default('false')
    .messages({
      'any.only': 'include_relations must be either "true" or "false"'
    }),
  
  method: Joi.string()
    .valid('CASH', 'CARD', 'MOBILE')
    .optional()
    .messages({
      'any.only': 'Payment method must be one of: CASH, CARD, MOBILE'
    }),
  
  transactionId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.guid': 'Transaction ID must be a valid UUID'
    }),
  
  branchId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.guid': 'Branch ID must be a valid UUID'
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
  
  minAmount: Joi.number()
    .positive()
    .precision(2)
    .optional()
    .messages({
      'number.base': 'Minimum amount must be a number',
      'number.positive': 'Minimum amount must be greater than 0'
    }),
  
  maxAmount: Joi.number()
    .positive()
    .precision(2)
    .min(Joi.ref('minAmount'))
    .optional()
    .messages({
      'number.base': 'Maximum amount must be a number',
      'number.positive': 'Maximum amount must be greater than 0',
      'number.min': 'Maximum amount must be greater than or equal to minimum amount'
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

// ✅ Get payment by ID query validation
export const getPaymentByIdSchema = Joi.object({
  include_relations: Joi.string()
    .valid('true', 'false')
    .default('false')
    .messages({
      'any.only': 'include_relations must be either "true" or "false"'
    })
});

// ✅ Process multiple payments validation
export const processMultiplePaymentsSchema = Joi.object({
  transactionId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Transaction ID must be a valid UUID',
      'any.required': 'Transaction ID is required'
    }),
  
  payments: Joi.array()
    .items(
      Joi.object({
        method: Joi.string()
          .valid('CASH', 'CARD', 'MOBILE')
          .required()
          .messages({
            'any.only': 'Payment method must be one of: CASH, CARD, MOBILE',
            'any.required': 'Payment method is required'
          }),
        
        amount: Joi.number()
          .positive()
          .precision(2)
          .required()
          .messages({
            'number.base': 'Amount must be a number',
            'number.positive': 'Amount must be greater than 0',
            'any.required': 'Amount is required'
          })
      })
    )
    .min(1)
    .required()
    .messages({
      'array.base': 'Payments must be an array',
      'array.min': 'At least one payment is required',
      'any.required': 'Payments array is required'
    })
});

// ✅ Get payment analytics query validation
export const getPaymentAnalyticsSchema = Joi.object({
  branchId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.guid': 'Branch ID must be a valid UUID'
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
    })
});