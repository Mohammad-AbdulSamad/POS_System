// // controllers/users.controller.js
// import { PrismaClient } from "@prisma/client";
// import bcrypt from "bcrypt";
// import asyncHandler from "../middleware/asyncHandler.middleware.js";
// import { NotFoundError, BadRequestError, ConflictError } from "../utils/errors.utils.js";
// import logger from "../config/logger.config.js";


// const prisma = new PrismaClient();
// const SALT_ROUNDS = 10;

// // Valid roles
// const VALID_ROLES = ['ADMIN', 'MANAGER', 'CASHIER', 'STOCK_MANAGER'];

// // Helper function to validate role
// const isValidRole = (role) => {
//   return !role || VALID_ROLES.includes(role.toUpperCase());
// };

// // Helper function to validate email
// const isValidEmail = (email) => {
//   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//   return emailRegex.test(email);
// };

// // Helper function to validate password strength
// const isValidPassword = (password) => {
//   // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
//   const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
//   return passwordRegex.test(password);
// };

// // 🟢 Get all users with filtering and pagination
// export const getAllUsers = async (req, res) => {
//   try {
//     const {
//       branchId,
//       role,
//       search,
//       active,
//       page = 1,
//       limit = 50
//     } = req.query;

//     const skip = (parseInt(page) - 1) * parseInt(limit);

//     const where = {
//       ...(branchId && { branchId }),
//       ...(role && { role: role.toUpperCase() }),
//       ...(search && {
//         OR: [
//           { name: { contains: search, mode: 'insensitive' } },
//           { email: { contains: search, mode: 'insensitive' } },
//           { phone: { contains: search, mode: 'insensitive' } }
//         ]
//       })
//     };

//     const [users, total] = await Promise.all([
//       prisma.user.findMany({
//         where,
//         select: {
//           id: true,
//           email: true,
//           name: true,
//           phone: true,
//           role: true,
//           branchId: true,
//           createdAt: true,
//           branch: {
//             select: {
//               id: true,
//               name: true,
//               address: true
//             }
//           },
//           _count: {
//             select: {
//               transactions: true
//             }
//           }
//         },
//         skip: parseInt(skip),
//         take: parseInt(limit),
//         orderBy: { createdAt: 'desc' }
//       }),
//       prisma.user.count({ where })
//     ]);

//     res.json({
//       users,
//       pagination: {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         total,
//         pages: Math.ceil(total / parseInt(limit))
//       }
//     });
//   } catch (err) {
//     console.error('Error in getAllUsers:', err);
//     res.status(500).json({ message: "Error fetching users", error: err.message });
//   }
// };

// // 🟢 Get user by ID
// export const getUserById = async (req, res) => {
//   try {
//     const user = await prisma.user.findUnique({
//       where: { id: req.params.id },
//       select: {
//         id: true,
//         email: true,
//         name: true,
//         phone: true,
//         role: true,
//         branchId: true,
//         createdAt: true,
//         branch: {
//           select: {
//             id: true,
//             name: true,
//             address: true
//           }
//         },
//         _count: {
//           select: {
//             transactions: true
//           }
//         }
//       }
//     });

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     res.json(user);
//   } catch (err) {
//     console.error('Error in getUserById:', err);
//     res.status(500).json({ message: "Error fetching user", error: err.message });
//   }
// };

// // 🟢 Create user
// export const createUser = async (req, res) => {
//   try {
//     const { email, name, password, phone, role, branchId } = req.body;

//     // Validate required fields
//     if (!email || !password) {
//       return res.status(400).json({
//         message: "Email and password are required"
//       });
//     }

//     // Validate email format
//     if (!isValidEmail(email)) {
//       return res.status(400).json({
//         message: "Invalid email format"
//       });
//     }

//     // Validate password strength
//     if (!isValidPassword(password)) {
//       return res.status(400).json({
//         message: "Password must be at least 8 characters with uppercase, lowercase, and number"
//       });
//     }

//     // Validate role if provided
//     if (role && !isValidRole(role)) {
//       return res.status(400).json({
//         message: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`
//       });
//     }

//     // Check if email already exists
//     const existingUser = await prisma.user.findUnique({
//       where: { email }
//     });

//     if (existingUser) {
//       return res.status(409).json({
//         message: "Email already registered"
//       });
//     }

//     // Validate branch exists if provided
//     if (branchId) {
//       const branch = await prisma.branch.findUnique({
//         where: { id: branchId }
//       });

//       if (!branch) {
//         return res.status(404).json({ message: "Branch not found" });
//       }
//     }

//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

//     // Create user
//     const user = await prisma.user.create({
//       data: {
//         email,
//         name: name || null,
//         password: hashedPassword,
//         phone: phone || null,
//         role: role ? role.toUpperCase() : 'CASHIER',
//         branchId: branchId || null
//       },
//       select: {
//         id: true,
//         email: true,
//         name: true,
//         phone: true,
//         role: true,
//         branchId: true,
//         createdAt: true,
//         branch: {
//           select: {
//             id: true,
//             name: true
//           }
//         }
//       }
//     });

//     res.status(201).json(user);
//   } catch (err) {
//     console.error('Error in createUser:', err);
//     res.status(500).json({ message: "Error creating user", error: err.message });
//   }
// };

// // 🟢 Update user
// export const updateUser = async (req, res) => {
//   try {
//     const { email, name, password, phone, role, branchId } = req.body;

//     // Check if user exists
//     const existingUser = await prisma.user.findUnique({
//       where: { id: req.params.id }
//     });

//     if (!existingUser) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Validate email if provided
//     if (email && !isValidEmail(email)) {
//       return res.status(400).json({
//         message: "Invalid email format"
//       });
//     }

//     // Check email uniqueness if changing email
//     if (email && email !== existingUser.email) {
//       const emailExists = await prisma.user.findUnique({
//         where: { email }
//       });

//       if (emailExists) {
//         return res.status(409).json({
//           message: "Email already registered"
//         });
//       }
//     }

//     // Validate password if provided
//     if (password && !isValidPassword(password)) {
//       return res.status(400).json({
//         message: "Password must be at least 8 characters with uppercase, lowercase, and number"
//       });
//     }

//     // Validate role if provided
//     if (role && !isValidRole(role)) {
//       return res.status(400).json({
//         message: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`
//       });
//     }

//     // Validate branch if provided
//     if (branchId) {
//       const branch = await prisma.branch.findUnique({
//         where: { id: branchId }
//       });

//       if (!branch) {
//         return res.status(404).json({ message: "Branch not found" });
//       }
//     }

//     // Prepare update data
//     const updateData = {
//       ...(email && { email }),
//       ...(name !== undefined && { name: name || null }),
//       ...(phone !== undefined && { phone: phone || null }),
//       ...(role && { role: role.toUpperCase() }),
//       ...(branchId !== undefined && { branchId: branchId || null })
//     };

//     // Hash password if provided
//     if (password) {
//       updateData.password = await bcrypt.hash(password, SALT_ROUNDS);
//     }

//     // Update user
//     const user = await prisma.user.update({
//       where: { id: req.params.id },
//       data: updateData,
//       select: {
//         id: true,
//         email: true,
//         name: true,
//         phone: true,
//         role: true,
//         branchId: true,
//         createdAt: true,
//         branch: {
//           select: {
//             id: true,
//             name: true
//           }
//         }
//       }
//     });

//     res.json(user);
//   } catch (err) {
//     console.error('Error in updateUser:', err);
//     res.status(500).json({ message: "Error updating user", error: err.message });
//   }
// };

// // 🟢 Delete user
// export const deleteUser = async (req, res) => {
//   try {
//     const user = await prisma.user.findUnique({
//       where: { id: req.params.id },
//       include: {
//         _count: {
//           select: {
//             transactions: true
//           }
//         }
//       }
//     });

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Check if user has transactions
//     if (user._count.transactions > 0) {
//       return res.status(400).json({
//         message: "Cannot delete user with existing transactions",
//         details: {
//           transactionCount: user._count.transactions
//         }
//       });
//     }

//     await prisma.user.delete({
//       where: { id: req.params.id }
//     });

//     res.json({ message: "User deleted successfully" });
//   } catch (err) {
//     console.error('Error in deleteUser:', err);
//     res.status(500).json({ message: "Error deleting user", error: err.message });
//   }
// };

// // 🆕 Get users by branch
// export const getUsersByBranch = async (req, res) => {
//   try {
//     const branchId = req.params.branchId;
//     const { role } = req.query;

//     const where = {
//       branchId,
//       ...(role && { role: role.toUpperCase() })
//     };

//     const users = await prisma.user.findMany({
//       where,
//       select: {
//         id: true,
//         email: true,
//         name: true,
//         phone: true,
//         role: true,
//         createdAt: true,
//         _count: {
//           select: {
//             transactions: true
//           }
//         }
//       },
//       orderBy: { name: 'asc' }
//     });

//     res.json({ users, count: users.length });
//   } catch (err) {
//     console.error('Error in getUsersByBranch:', err);
//     res.status(500).json({ message: "Error fetching branch users", error: err.message });
//   }
// };

// // 🆕 Get users by role
// export const getUsersByRole = async (req, res) => {
//   try {
//     const role = req.params.role.toUpperCase();

//     if (!isValidRole(role)) {
//       return res.status(400).json({
//         message: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`
//       });
//     }

//     const users = await prisma.user.findMany({
//       where: { role },
//       select: {
//         id: true,
//         email: true,
//         name: true,
//         phone: true,
//         branchId: true,
//         createdAt: true,
//         branch: {
//           select: {
//             id: true,
//             name: true
//           }
//         }
//       },
//       orderBy: { name: 'asc' }
//     });

//     res.json({ role, users, count: users.length });
//   } catch (err) {
//     console.error('Error in getUsersByRole:', err);
//     res.status(500).json({ message: "Error fetching users by role", error: err.message });
//   }
// };

// // 🆕 Get user statistics
// export const getUserStats = async (req, res) => {
//   try {
//     const userId = req.params.userId;

//     const [user, transactionStats] = await Promise.all([
//       prisma.user.findUnique({
//         where: { id: userId },
//         select: {
//           id: true,
//           email: true,
//           name: true,
//           role: true,
//           createdAt: true,
//           branch: {
//             select: {
//               id: true,
//               name: true
//             }
//           }
//         }
//       }),
//       prisma.transaction.aggregate({
//         where: {
//           cashierId: userId,
//           status: { in: ['COMPLETED', 'PARTIALLY_REFUNDED', 'REFUNDED'] }
//         },
//         _count: true,
//         _sum: {
//           totalGross: true,
//           refundedAmount: true
//         },
//         _avg: {
//           totalGross: true
//         }
//       })
//     ]);

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     const todayTransactions = await prisma.transaction.count({
//       where: {
//         cashierId: userId,
//         createdAt: { gte: today },
//         status: { in: ['COMPLETED', 'PARTIALLY_REFUNDED', 'REFUNDED'] }
//       }
//     });

//     res.json({
//       user,
//       stats: {
//         totalTransactions: transactionStats._count,
//         totalSalesAmount: transactionStats._sum.totalGross || 0,
//         totalRefunded: transactionStats._sum.refundedAmount || 0,
//         averageTransaction: transactionStats._avg.totalGross || 0,
//         todayTransactions
//       }
//     });
//   } catch (err) {
//     console.error('Error in getUserStats:', err);
//     res.status(500).json({ message: "Error fetching user statistics", error: err.message });
//   }
// };

// export const changePassword = async (req, res) => {
//   try {
//     const { currentPassword, newPassword } = req.body;
//     const targetUserId = req.params.id; // User whose password we're trying to change
//     const currentUserId = req.user.id;  // Authenticated user

//     if (!currentPassword || !newPassword) {
//       return res.status(400).json({
//         message: "Current password and new password are required"
//       });
//     }

//     // Check ownership: only allow users to change their own password
//     // unless they're admin/manager (handled by middleware)
//     if (targetUserId !== currentUserId && !['ADMIN', 'MANAGER'].includes(req.user.role)) {
//       return res.status(403).json({
//         message: "Access denied",
//         error: "You can only change your own password"
//       });
//     }

//     // Validate new password strength
//     if (!isValidPassword(newPassword)) {
//       return res.status(400).json({
//         message: "New password must be at least 8 characters with uppercase, lowercase, and number"
//       });
//     }

//     // Get user with password
//     const user = await prisma.user.findUnique({
//       where: { id: targetUserId }
//     });

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Verify current password
//     const passwordMatches = await bcrypt.compare(currentPassword, user.password);

//     if (!passwordMatches) {
//       return res.status(401).json({
//         message: "Current password is incorrect"
//       });
//     }

//     // Hash new password
//     const hashedPassword = await bcrypt.hash(newPassword, 10);

//     // Update password
//     await prisma.user.update({
//       where: { id: targetUserId },
//       data: { password: hashedPassword }
//     });

//     // Revoke all refresh tokens for this user (force re-login)
//     await prisma.refreshToken.deleteMany({
//       where: { userId: targetUserId }
//     });

//     res.json({
//       message: 'Password changed successfully. Please login again.'
//     });
//   } catch (error) {
//     console.error('Change password error:', error);
//     res.status(500).json({
//       message: 'Password change failed',
//       error: error.message
//     });
//   }
// };
// // 🆕 Reset password (admin only)
// export const resetPassword = async (req, res) => {
//   try {
//     const { newPassword } = req.body;

//     if (!newPassword) {
//       return res.status(400).json({
//         message: "New password is required"
//       });
//     }

//     // Validate password strength
//     if (!isValidPassword(newPassword)) {
//       return res.status(400).json({
//         message: "Password must be at least 8 characters with uppercase, lowercase, and number"
//       });
//     }

//     const user = await prisma.user.findUnique({
//       where: { id: req.params.id }
//     });

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Hash new password
//     const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

//     // Update password
//     await prisma.user.update({
//       where: { id: req.params.id },
//       data: { password: hashedPassword }
//     });

//     res.json({ message: "Password reset successfully" });
//   } catch (err) {
//     console.error('Error in resetPassword:', err);
//     res.status(500).json({ message: "Error resetting password", error: err.message });
//   }
// };

// // 🆕 Get users summary
// // 🆕 Get users summary
// export const getUsersSummary = async (req, res) => {
//   try {
//     const [totalUsers, byRole, byBranch] = await Promise.all([
//       prisma.user.count(),
//       prisma.user.groupBy({
//         by: ['role'],
//         _count: true
//       }),
//       prisma.user.groupBy({
//         by: ['branchId'],
//         _count: true
//       })
//     ]);

//     const usersWithoutBranch = byBranch.find(b => b.branchId === null)?._count || 0;
//     const usersWithBranch = totalUsers - usersWithoutBranch;

//     res.json({
//       summary: {
//         totalUsers
//       },
//       byRole: byRole.map(r => ({
//         role: r.role,
//         count: r._count
//       })),
//       byBranch: {
//         withBranch: usersWithBranch,
//         withoutBranch: usersWithoutBranch
//       }
//     });
//   } catch (err) {
//     console.error('Error in getUsersSummary:', err);
//     res.status(500).json({ message: "Error fetching users summary", error: err.message });
//   }
// };


// // 🆕 Validate user email
// export const validateEmail = async (req, res) => {
//   try {
//     const { email } = req.body;

//     if (!email) {
//       return res.status(400).json({
//         message: "Email is required"
//       });
//     }

//     if (!isValidEmail(email)) {
//       return res.json({
//         valid: false,
//         message: "Invalid email format"
//       });
//     }

//     const existingUser = await prisma.user.findUnique({
//       where: { email }
//     });

//     if (existingUser) {
//       return res.json({
//         valid: false,
//         message: "Email exists"
//       });
//     }

//     res.json({
//       valid: true,
//       message: "Email is available"
//     });
//   } catch (err) {
//     console.error('Error in validateEmail:', err);
//     res.status(500).json({ message: "Error validating email", error: err.message });
//   }
// };
// controllers/users.controller.js
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import asyncHandler from "../middleware/asyncHandler.middleware.js";
import { NotFoundError, BadRequestError, ConflictError } from "../utils/errors.utils.js";
import logger from "../config/logger.config.js";

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

// Valid roles
const VALID_ROLES = ['ADMIN', 'MANAGER', 'CASHIER', 'STOCK_MANAGER'];

// Helper function to validate role
const isValidRole = (role) => {
  return !role || VALID_ROLES.includes(role.toUpperCase());
};

// Helper function to validate email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Helper function to validate password strength
const isValidPassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};

// Helper: safe integer parse
const toInt = (v, fallback = 0) => {
  const n = parseInt(v);
  return Number.isNaN(n) ? fallback : n;
};

// -------------------------
// Get all users
// -------------------------
export const getAllUsers = asyncHandler(async (req, res) => {
  const {
    branchId,
    role,
    search,
    active,
    page = 1,
    limit = 50
  } = req.query;

  const skip = (toInt(page, 1) - 1) * toInt(limit, 50);

  const where = {
    ...(branchId && { branchId }),
    ...(role && { role: role.toUpperCase() }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ]
    }),
    ...(active !== undefined && { active: active === 'true' })
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        branchId: true,
        createdAt: true,
        branch: {
          select: {
            id: true,
            name: true,
            address: true
          }
        },
        _count: {
          select: {
            transactions: true
          }
        }
      },
      skip,
      take: toInt(limit, 50),
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count({ where })
  ]);

  logger.logDatabase('READ', {
    model: 'User',
    operation: 'getAllUsers',
    count: users.length,
    filters: { branchId, role, search, active },
    userId: req.user?.id
  });

  res.json({
    users,
    pagination: {
      page: toInt(page, 1),
      limit: toInt(limit, 50),
      total,
      pages: Math.ceil(total / toInt(limit, 50))
    }
  });
});

// -------------------------
// Get user by ID
// -------------------------
export const getUserById = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      branchId: true,
      createdAt: true,
      branch: {
        select: {
          id: true,
          name: true,
          address: true
        }
      },
      _count: {
        select: {
          transactions: true
        }
      }
    }
  });

  if (!user) throw new NotFoundError('User not found');

  logger.logDatabase('READ', {
    model: 'User',
    operation: 'getUserById',
    id: req.params.id,
    userId: req.user?.id
  });

  res.json(user);
});

// -------------------------
// Create user
// -------------------------
export const createUser = asyncHandler(async (req, res) => {
  const { email, name, password, phone, role, branchId } = req.body;

  if (!email || !password) {
    throw new BadRequestError('Email and password are required');
  }

  if (!isValidEmail(email)) {
    throw new BadRequestError('Invalid email format');
  }

  if (!isValidPassword(password)) {
    throw new BadRequestError('Password must be at least 8 characters with uppercase, lowercase, and number');
  }

  if (role && !isValidRole(role)) {
    throw new BadRequestError(`Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`);
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new ConflictError('Email already registered');

  if (branchId) {
    const branch = await prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) throw new NotFoundError('Branch not found');
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email,
      name: name || null,
      password: hashedPassword,
      phone: phone || null,
      role: role ? role.toUpperCase() : 'CASHIER',
      branchId: branchId || null
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      branchId: true,
      createdAt: true,
      branch: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  logger.info({
    message: 'User created',
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    branchId: user.branchId,
    createdBy: req.user?.id,
    createdByEmail: req.user?.email
  });

  res.status(201).json(user);
});

// -------------------------
// Update user
// -------------------------
export const updateUser = asyncHandler(async (req, res) => {
  const { email, name, password, phone, role, branchId } = req.body;

  const existingUser = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!existingUser) throw new NotFoundError('User not found');

  if (email && !isValidEmail(email)) throw new BadRequestError('Invalid email format');

  if (email && email !== existingUser.email) {
    const emailExists = await prisma.user.findUnique({ where: { email } });
    if (emailExists) throw new ConflictError('Email already registered');
  }

  if (password && !isValidPassword(password)) {
    throw new BadRequestError('Password must be at least 8 characters with uppercase, lowercase, and number');
  }

  if (role && !isValidRole(role)) {
    throw new BadRequestError(`Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`);
  }

  if (branchId) {
    const branch = await prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) throw new NotFoundError('Branch not found');
  }

  const updateData = {
    ...(email && { email }),
    ...(name !== undefined && { name: name || null }),
    ...(phone !== undefined && { phone: phone || null }),
    ...(role && { role: role.toUpperCase() }),
    ...(branchId !== undefined && { branchId: branchId || null })
  };

  if (password) {
    updateData.password = await bcrypt.hash(password, SALT_ROUNDS);
  }

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      branchId: true,
      createdAt: true,
      branch: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  logger.info({
    message: 'User updated',
    userId: user.id,
    changes: { email: !!email, name: !!name, phone: !!phone, role: !!role, branchId: !!branchId },
    updatedBy: req.user?.id,
    updatedByEmail: req.user?.email
  });

  res.json(user);
});

// -------------------------
// Delete user (hard delete)
// -------------------------
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: {
      _count: { select: { transactions: true } }
    }
  });

  if (!user) throw new NotFoundError('User not found');

  if (user._count.transactions > 0) {
    throw new BadRequestError('Cannot delete user with existing transactions', {
      details: { transactionCount: user._count.transactions }
    });
  }

  await prisma.user.delete({ where: { id: req.params.id } });

  logger.warn({
    message: 'User deleted (hard delete)',
    userId: user.id,
    email: user.email,
    deletedBy: req.user?.id,
    deletedByEmail: req.user?.email
  });

  res.json({ message: 'User deleted successfully' });
});

// -------------------------
// Get users by branch
// -------------------------
export const getUsersByBranch = asyncHandler(async (req, res) => {
  const branchId = req.params.branchId;
  const { role } = req.query;

  const where = {
    branchId,
    ...(role && { role: role.toUpperCase() })
  };

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      createdAt: true,
      _count: { select: { transactions: true } }
    },
    orderBy: { name: 'asc' }
  });

  logger.logDatabase('READ', {
    model: 'User',
    operation: 'getUsersByBranch',
    branchId,
    count: users.length,
    userId: req.user?.id
  });

  res.json({ users, count: users.length });
});

// -------------------------
// Get users by role
// -------------------------
export const getUsersByRole = asyncHandler(async (req, res) => {
  const role = req.params.role.toUpperCase();

  if (!isValidRole(role)) throw new BadRequestError(`Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`);

  const users = await prisma.user.findMany({
    where: { role },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      branchId: true,
      createdAt: true,
      branch: { select: { id: true, name: true } }
    },
    orderBy: { name: 'asc' }
  });

  logger.logDatabase('READ', {
    model: 'User',
    operation: 'getUsersByRole',
    role,
    count: users.length,
    userId: req.user?.id
  });

  res.json({ role, users, count: users.length });
});

// -------------------------
// Get user statistics
// -------------------------
export const getUserStats = asyncHandler(async (req, res) => {
  const userId = req.params.userId;

  const [user, transactionStats] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        branch: { select: { id: true, name: true } }
      }
    }),
    prisma.transaction.aggregate({
      where: {
        cashierId: userId,
        status: { in: ['COMPLETED', 'PARTIALLY_REFUNDED', 'REFUNDED'] }
      },
      _count: true,
      _sum: { totalGross: true, refundedAmount: true },
      _avg: { totalGross: true }
    })
  ]);

  if (!user) throw new NotFoundError('User not found');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayTransactions = await prisma.transaction.count({
    where: {
      cashierId: userId,
      createdAt: { gte: today },
      status: { in: ['COMPLETED', 'PARTIALLY_REFUNDED', 'REFUNDED'] }
    }
  });

  logger.logDatabase('READ', {
    model: 'User',
    operation: 'getUserStats',
    userId,
    userIdRequested: req.user?.id
  });

  res.json({
    user,
    stats: {
      totalTransactions: transactionStats._count,
      totalSalesAmount: transactionStats._sum.totalGross || 0,
      totalRefunded: transactionStats._sum.refundedAmount || 0,
      averageTransaction: transactionStats._avg.totalGross || 0,
      todayTransactions
    }
  });
});

// -------------------------
// Change password (user or admin/manager)
// -------------------------
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const targetUserId = req.params.id;
  const currentUserId = req.user.id;

  if (!currentPassword || !newPassword) throw new BadRequestError('Current password and new password are required');

  // Only allow if target is self or admin/manager (middleware may enforce roles too)
  if (targetUserId !== currentUserId && !['ADMIN', 'MANAGER'].includes(req.user.role)) {
    throw new BadRequestError('Access denied: You can only change your own password');
  }

  if (!isValidPassword(newPassword)) {
    throw new BadRequestError('New password must be at least 8 characters with uppercase, lowercase, and number');
  }

  const user = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!user) throw new NotFoundError('User not found');

  const passwordMatches = await bcrypt.compare(currentPassword, user.password);
  if (!passwordMatches) throw new BadRequestError('Current password is incorrect');

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.user.update({ where: { id: targetUserId }, data: { password: hashedPassword } });

  // Revoke refresh tokens
  await prisma.refreshToken.deleteMany({ where: { userId: targetUserId } });

  logger.warn({
    severity: 'high',
    message: 'User password changed',
    targetUserId,
    initiatedBy: req.user?.id,
    initiatedByEmail: req.user?.email
  });

  res.json({ message: 'Password changed successfully. Please login again.' });
});

// -------------------------
// Reset password (admin only)
// -------------------------
export const resetPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword) throw new BadRequestError('New password is required');
  if (!isValidPassword(newPassword)) throw new BadRequestError('Password must be at least 8 characters with uppercase, lowercase, and number');

  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw new NotFoundError('User not found');

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.user.update({ where: { id: req.params.id }, data: { password: hashedPassword } });

  logger.warn({
    severity: 'high',
    message: 'User password reset by admin',
    targetUserId: req.params.id,
    initiatedBy: req.user?.id,
    initiatedByEmail: req.user?.email
  });

  res.json({ message: 'Password reset successfully' });
});

// -------------------------
// Get users summary
// -------------------------
export const getUsersSummary = asyncHandler(async (req, res) => {
  const [totalUsers, byRole, byBranch] = await Promise.all([
    prisma.user.count(),
    prisma.user.groupBy({ by: ['role'], _count: true }),
    prisma.user.groupBy({ by: ['branchId'], _count: true })
  ]);

  const usersWithoutBranch = byBranch.find(b => b.branchId === null)?._count || 0;
  const usersWithBranch = totalUsers - usersWithoutBranch;

  logger.logDatabase('READ', {
    model: 'User',
    operation: 'getUsersSummary',
    totalUsers,
    userId: req.user?.id
  });

  res.json({
    summary: { totalUsers },
    byRole: byRole.map(r => ({ role: r.role, count: r._count })),
    byBranch: { withBranch: usersWithBranch, withoutBranch: usersWithoutBranch }
  });
});

// -------------------------
// Validate user email
// -------------------------
export const validateEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) throw new BadRequestError('Email is required');

  if (!isValidEmail(email)) {
    return res.json({ valid: false, message: 'Invalid email format' });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    logger.logDatabase('READ', {
      model: 'User',
      operation: 'validateEmail',
      email,
      userId: req.user?.id
    });
    return res.json({ valid: false, message: 'Email exists' });
  }

  logger.logDatabase('READ', {
    model: 'User',
    operation: 'validateEmail',
    email,
    userId: req.user?.id
  });

  res.json({ valid: true, message: 'Email is available' });
});
