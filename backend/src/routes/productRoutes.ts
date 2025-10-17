import express from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getExternalProducts,
  getAllProductsCombined,
} from '../controllers/productController';
import { authenticate, isAdmin } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/external', getExternalProducts); // Get products from external API
router.get('/all', getAllProductsCombined); // Get combined local + external
router.get('/', getAllProducts); // Get local products only
router.get('/:id', getProductById);

// Protected routes (admin only)
router.post('/', authenticate, isAdmin, createProduct);
router.put('/:id', authenticate, isAdmin, updateProduct);
router.delete('/:id', authenticate, isAdmin, deleteProduct);

export default router;
