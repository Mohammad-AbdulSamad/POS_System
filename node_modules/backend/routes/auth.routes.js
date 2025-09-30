// routes/auth.routes.js
import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Public routes (no authentication required)
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);

// Protected routes (authentication required)
router.post('/logout', authenticate, authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);
router.get('/me', authenticate, authController.me);
router.post('/verify', authenticate, authController.verifyToken);
router.post('/change-password', authenticate, authController.changeMyPassword);

// Session management
router.get('/sessions', authenticate, authController.getActiveSessions);
router.delete('/sessions/:sessionId', authenticate, authController.revokeSession);

export default router;