import { Router } from 'express';
import { 
  getAllStaff, 
  getStaffById, 
  createStaff, 
  updateStaff, 
  deleteStaff, 
  updateStaffPassword,
  updateOwnProfile,
  getRolePermissions
} from '../controllers/staffController';
import { authenticateToken, checkPermission } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/permissions/:role', getRolePermissions);

// Protected routes - all staff members
router.use(authenticateToken);

// Profile management routes (all staff can update their own profile)
router.put('/profile', updateOwnProfile);

// Staff management routes (requires staff management permission)
router.get('/', checkPermission('canManageStaff'), getAllStaff);
router.get('/:id', checkPermission('canManageStaff'), getStaffById);
router.post('/', checkPermission('canManageStaff'), createStaff);
router.put('/:id', checkPermission('canManageStaff'), updateStaff);
router.delete('/:id', checkPermission('canManageStaff'), deleteStaff);
router.put('/:id/password', checkPermission('canManageStaff'), updateStaffPassword);

export default router;