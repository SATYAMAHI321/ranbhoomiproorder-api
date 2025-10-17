import express from 'express';
import {
  trackOrder,
  createOrder,
  getAllOrders,
  updateOrder,
  deleteOrder,
  getOrderStats,
  getExternalOrders,
  generateTrackingForExternalOrder,
  updateExternalOrderStatus,
  trackExternalOrder,
  getAllTrackingRecords,
  updateTrackingRecord,
  deleteTrackingRecord,
} from '../controllers/orderController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/track/:trackingId', trackOrder);
router.get('/track/external/:trackingId', trackExternalOrder); // Track external order

// Protected routes - Tracking Management
router.get('/tracking/all', authenticate, getAllTrackingRecords); // Get all tracking records
router.put('/tracking/:id', authenticate, updateTrackingRecord); // Update tracking record
router.delete('/tracking/:id', authenticate, deleteTrackingRecord); // Delete tracking record

// Protected routes - External Orders
router.get('/external', authenticate, getExternalOrders); // Get external orders from Ranbhoomi
router.post('/external/:orderId/generate-tracking', authenticate, generateTrackingForExternalOrder); // Generate tracking ID
router.put('/external/:orderId/update-status', authenticate, updateExternalOrderStatus); // Update external order status

// Protected routes - Regular Orders
router.post('/', authenticate, createOrder);
router.get('/', authenticate, getAllOrders);
router.get('/stats', authenticate, getOrderStats);
router.put('/:id', authenticate, updateOrder);
router.delete('/:id', authenticate, deleteOrder);

export default router;
