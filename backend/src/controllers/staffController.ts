import { Request, Response } from 'express';
import Staff from '../models/Staff';
import ActivityLog from '../models/ActivityLog';

// Get all staff members with filtering
export const getAllStaff = async (req: Request, res: Response) => {
  try {
    const { role, isActive } = req.query;
    const filter: any = {};
    
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const staff = await Staff.find(filter).select('-password');
    res.json({ success: true, data: { staff } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch staff members', error });
  }
};

// Get staff member by ID
export const getStaffById = async (req: Request, res: Response) => {
  try {
    const staff = await Staff.findById(req.params.id).select('-password');
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }
    res.json({ success: true, data: { staff } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch staff member', error });
  }
};

// Create new staff member
export const createStaff = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, permissions, profile } = req.body;
    
    // Check if staff member already exists
    const existingStaff = await Staff.findOne({ email });
    if (existingStaff) {
      return res.status(400).json({ success: false, message: 'Staff member with this email already exists' });
    }
    
    // Create new staff member
    const staff = new Staff({
      name,
      email,
      password,
      role,
      permissions,
      profile,
      createdBy: {
        id: (req as any).user._id,
        name: (req as any).user.name,
        email: (req as any).user.email
      }
    });
    
    await staff.save();
    
    // Log activity
    await ActivityLog.create({
      adminId: (req as any).user._id,
      adminName: (req as any).user.name,
      adminEmail: (req as any).user.email,
      action: 'create_staff',
      category: 'staff',
      details: `Created new staff member: ${name} (${email}) with role: ${role}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    const staffWithoutPassword = await Staff.findById(staff._id).select('-password');
    res.status(201).json({ success: true, data: { staff: staffWithoutPassword } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create staff member', error });
  }
};

// Update staff member
export const updateStaff = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, role, permissions, profile, isActive } = req.body;
    
    // Prevent updating superadmin role by non-superadmins
    const updater = (req as any).user;
    if (role === 'superadmin' && updater.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Only superadmins can assign superadmin role' });
    }
    
    // Check if email is being changed and if it's already taken
    if (email) {
      const existingStaff = await Staff.findOne({ email, _id: { $ne: id } });
      if (existingStaff) {
        return res.status(400).json({ success: false, message: 'Email already in use by another staff member' });
      }
    }
    
    const updateData: any = { name, email, role, permissions, profile };
    if (isActive !== undefined) updateData.isActive = isActive;
    
    const staff = await Staff.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }
    
    // Log activity
    await ActivityLog.create({
      adminId: (req as any).user._id,
      adminName: (req as any).user.name,
      adminEmail: (req as any).user.email,
      action: 'update_staff',
      category: 'staff',
      details: `Updated staff member: ${name} (${email})`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({ success: true, data: { staff } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update staff member', error });
  }
};

// Update staff password
export const updateStaffPassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    
    const staff = await Staff.findById(id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }
    
    // Verify current password
    const isMatch = await staff.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    
    // Update password
    staff.password = newPassword;
    await staff.save();
    
    // Log activity
    await ActivityLog.create({
      adminId: (req as any).user._id,
      adminName: (req as any).user.name,
      adminEmail: (req as any).user.email,
      action: 'update_password',
      category: 'auth',
      details: `Updated password for staff member: ${staff.name} (${staff.email})`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update password', error });
  }
};

// Update own profile
export const updateOwnProfile = async (req: Request, res: Response) => {
  try {
    const { name, email, profile } = req.body;
    const staffId = (req as any).user._id;
    
    // Check if email is being changed and if it's already taken
    if (email) {
      const existingStaff = await Staff.findOne({ email, _id: { $ne: staffId } });
      if (existingStaff) {
        return res.status(400).json({ success: false, message: 'Email already in use by another staff member' });
      }
    }
    
    const staff = await Staff.findByIdAndUpdate(
      staffId,
      { name, email, profile },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }
    
    // Update session data
    const updatedAdminData = {
      _id: staff._id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
      permissions: staff.permissions,
      profile: staff.profile
    };
    
    // Log activity
    await ActivityLog.create({
      adminId: (req as any).user._id,
      adminName: (req as any).user.name,
      adminEmail: (req as any).user.email,
      action: 'update_profile',
      category: 'auth',
      details: `Updated own profile`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({ success: true, data: { staff: updatedAdminData } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update profile', error });
  }
};

// Delete staff member
export const deleteStaff = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Prevent deleting superadmins
    const staff = await Staff.findById(id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }
    
    if (staff.role === 'superadmin') {
      return res.status(403).json({ success: false, message: 'Cannot delete superadmin accounts' });
    }
    
    await Staff.findByIdAndDelete(id);
    
    // Log activity
    await ActivityLog.create({
      adminId: (req as any).user._id,
      adminName: (req as any).user.name,
      adminEmail: (req as any).user.email,
      action: 'delete_staff',
      category: 'staff',
      details: `Deleted staff member: ${staff.name} (${staff.email})`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({ success: true, message: 'Staff member deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete staff member', error });
  }
};

// Get permissions based on role
export const getRolePermissions = async (req: Request, res: Response) => {
  try {
    const { role } = req.params;
    
    const permissions = {
      superadmin: {
        canManageChats: true,
        canManageOrders: true,
        canManageTracking: true,
        canManageProducts: true,
        canManageStaff: true,
        canViewReports: true,
        canDeleteRecords: true
      },
      admin: {
        canManageChats: true,
        canManageOrders: true,
        canManageTracking: true,
        canManageProducts: true,
        canManageStaff: false,
        canViewReports: true,
        canDeleteRecords: true
      },
      staff: {
        canManageChats: true,
        canManageOrders: false,
        canManageTracking: true,
        canManageProducts: false,
        canManageStaff: false,
        canViewReports: false,
        canDeleteRecords: false
      }
    };
    
    res.json({ success: true, data: { permissions: permissions[role as keyof typeof permissions] || permissions.staff } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch permissions', error });
  }
};