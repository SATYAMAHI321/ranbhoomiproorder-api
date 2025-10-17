import express from 'express';
import {
  getChatByTrackingId,
  createOrGetChat,
  getAllChats,
  updateChatStatus,
  markChatAsRead,
  deleteChat,
} from '../controllers/chatController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/:trackingId', getChatByTrackingId);
router.post('/', createOrGetChat);

// Protected routes
router.get('/', authenticate, getAllChats);
router.put('/:id/status', authenticate, updateChatStatus);
router.put('/:id/read', authenticate, markChatAsRead);
router.delete('/:id', authenticate, deleteChat);

export default router;
