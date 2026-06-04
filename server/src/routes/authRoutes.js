import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { registerValidation, loginValidation } from '../validators/authValidator.js';
import { authMiddleware } from '../middleware/index.js';
import { authLimiter } from '../middleware/rateLimitMiddleware.js';

const router = Router();

router.post('/register', authLimiter, registerValidation, authController.register);
router.post('/login', authLimiter, loginValidation, authController.login);
router.get('/me', authMiddleware, authController.me);

export default router;
