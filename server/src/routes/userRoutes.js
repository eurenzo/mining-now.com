import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { authMiddleware, adminMiddleware } from '../middleware/index.js';
import { validateIdParam } from '../middleware/validateIdMiddleware.js';
import { updateUserValidation, userIdValidation } from '../validators/userValidator.js';
import { apiLimiter } from '../middleware/rateLimitMiddleware.js';

const router = Router();

router.use(apiLimiter);
router.use(authMiddleware, adminMiddleware);
router.get('/', userController.listUsers);
router.get('/:id', validateIdParam, userController.getUser);
router.put('/:id', validateIdParam, updateUserValidation, userController.updateUser);
router.delete('/:id', validateIdParam, userController.deleteUser);

export default router;
