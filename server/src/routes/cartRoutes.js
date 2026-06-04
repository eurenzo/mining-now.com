import { Router } from 'express';
import * as cartController from '../controllers/cartController.js';
import { authMiddleware } from '../middleware/index.js';
import { validateIdParam } from '../middleware/validateIdMiddleware.js';
import { addCartItemValidation, updateCartItemValidation } from '../validators/cartValidator.js';
import { apiLimiter } from '../middleware/rateLimitMiddleware.js';

const router = Router();

router.use(apiLimiter);
router.use(authMiddleware);
router.get('/', cartController.getCart);
router.post('/items', addCartItemValidation, cartController.addCartItem);
router.put('/items/:id', validateIdParam, updateCartItemValidation, cartController.updateCartItem);
router.delete('/items/:id', validateIdParam, cartController.deleteCartItem);
router.delete('/clear', cartController.clearCart);

export default router;
