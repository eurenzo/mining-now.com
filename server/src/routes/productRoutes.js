import { Router } from 'express';
import * as productController from '../controllers/productController.js';
import { authMiddleware, adminMiddleware } from '../middleware/index.js';
import { validateIdParam } from '../middleware/validateIdMiddleware.js';
import { createProductValidation, updateProductValidation, productQueryValidation } from '../validators/productValidator.js';
import { apiLimiter } from '../middleware/rateLimitMiddleware.js';

const router = Router();

router.use(apiLimiter);
router.get('/', productQueryValidation, productController.listProducts);
router.get('/:id', validateIdParam, productController.getProduct);
router.post('/', authMiddleware, adminMiddleware, createProductValidation, productController.createProduct);
router.put('/:id', validateIdParam, authMiddleware, adminMiddleware, updateProductValidation, productController.updateProduct);
router.delete('/:id', validateIdParam, authMiddleware, adminMiddleware, productController.deleteProduct);

export default router;
