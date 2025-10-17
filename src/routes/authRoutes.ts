import express from 'express';
import { login, register, getMe } from '../controllers/authController';
import { authenticate, isAdmin } from '../middleware/auth';

const router = express.Router();

router.post('/login', login);
router.post('/register', authenticate, isAdmin, register);
router.get('/me', authenticate, getMe);

export default router;
