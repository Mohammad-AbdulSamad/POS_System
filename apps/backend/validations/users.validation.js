import Joi from "joi";

const id = Joi.string().uuid().required().messages({
  "string.guid": "ID must be a valid UUID",
  "any.required": "ID is required"
});

const optionalId = Joi.string().uuid().optional();

const pageSchema = Joi.number().integer().min(1).default(1);
const limitSchema = Joi.number().integer().min(1).max(500).default(50);

const VALID_ROLES = ["ADMIN", "MANAGER", "CASHIER", "STOCK_MANAGER"];

//const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

// -------------------------
// Get all users (query)
// -------------------------
export const getAllUsersSchema = Joi.object({
  branchId: Joi.string().uuid().optional(),
  role: Joi.string().valid(...VALID_ROLES).optional(),
  search: Joi.string().trim().max(200).optional(),
  active: Joi.string().valid("true", "false").optional(),
  page: pageSchema,
  limit: limitSchema
});

// -------------------------
// Get user by id
// -------------------------
export const getUserByIdSchema = Joi.object({
  id
});

// -------------------------
// Create user
// -------------------------
export const createUserSchema = Joi.object({
  branchId: optionalId,
  email: Joi.string().trim().lowercase().email().required().messages({
    "string.email": "Email must be a valid email address",
    "any.required": "Email is required"
  }),
  name: Joi.string().trim().min(1).max(100).optional(),
  // password: Joi.string().pattern(passwordRegex).required().messages({
  //   "string.pattern.base":
  //     "Password must be at least 8 characters and include uppercase, lowercase and number",
  //   "any.required": "Password is required"
  // }),
  phone: Joi.string().trim().max(30).optional(),
  role: Joi.string().valid(...VALID_ROLES).optional().default("CASHIER"),
  active: Joi.boolean().optional()
});

// -------------------------
// Update user
// -------------------------
export const updateUserSchema = Joi.object({
  id,
  branchId: optionalId,
  email: Joi.string().trim().lowercase().email().optional().messages({
    "string.email": "Email must be a valid email address"
  }),
  name: Joi.string().trim().min(1).max(100).allow(null).optional(),
  // password: Joi.string().pattern(passwordRegex).optional().messages({
  //   "string.pattern.base":
  //     "Password must be at least 8 characters and include uppercase, lowercase and number"
  // }),
  phone: Joi.string().trim().max(30).allow(null).optional(),
  role: Joi.string().valid(...VALID_ROLES).optional(),
  active: Joi.boolean().optional()
})
  .min(1)
  .messages({
    "object.min": "At least one field must be provided to update"
  });

// -------------------------
// Change password (by user)
// -------------------------
export const changePasswordSchema = Joi.object({
  id,
  // currentPassword: Joi.string().required().messages({
  //   "any.required": "Current password is required"
  // }),
  // newPassword: Joi.string().pattern(passwordRegex).required().messages({
  //   "string.pattern.base":
  //     "New password must be at least 8 characters and include uppercase, lowercase and number",
  //   "any.required": "New password is required"
  // })
});

// -------------------------
// Reset password (admin)
// -------------------------
export const resetPasswordSchema = Joi.object({
  id,
  // newPassword: Joi.string().pattern(passwordRegex).required().messages({
  //   "string.pattern.base":
  //     "New password must be at least 8 characters and include uppercase, lowercase and number",
  //   "any.required": "New password is required"
  // })
});

// -------------------------
// Get users by branch (params + optional query)
// -------------------------
export const getUsersByBranchSchema = Joi.object({
  branchId: Joi.string().uuid().required().messages({
    "string.guid": "Branch ID must be a valid UUID",
    "any.required": "Branch ID is required"
  }),
  role: Joi.string().valid(...VALID_ROLES).optional(),
  page: pageSchema,
  limit: limitSchema
});

// -------------------------
// Get users by role (params)
// -------------------------
export const getUsersByRoleSchema = Joi.object({
  role: Joi.string().valid(...VALID_ROLES).required().messages({
    "any.required": "Role is required",
    "any.only": `Role must be one of: ${VALID_ROLES.join(", ")}`
  }),
  page: pageSchema,
  limit: limitSchema
});

