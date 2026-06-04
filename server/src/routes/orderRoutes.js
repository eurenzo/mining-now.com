import { Router } from 'express';
import * as orderController from '../controllers/orderController.js';
import { authMiddleware, adminMiddleware } from '../middleware/index.js';
import { validateIdParam } from '../middleware/validateIdMiddleware.js';
import { orderStatusValidation, orderIdValidation } from '../validators/orderValidator.js';
import { apiLimiter } from '../middleware/rateLimitMiddleware.js';

const router = Router();

router.use(apiLimiter);
router.use(authMiddleware);
router.post('/', orderController.checkout);
router.get('/', orderController.listOrders);
router.get('/:id', validateIdParam, orderController.getOrder);
router.patch('/:id/status', validateIdParam, adminMiddleware, orderStatusValidation, orderController.updateOrderStatus);

export default router;
