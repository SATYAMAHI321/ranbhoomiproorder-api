import { Request, Response } from 'express';
import Admin from '../models/Admin';
import { generateToken } from '../utils/jwtHelper';

/**
 * @route   POST /api/auth/login
 * @desc    Admin login
 * @access  Public
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({ message: 'Please provide email and password' });
      return;
    }

    // Find admin
    const admin = await Admin.findOne({ email });

    if (!admin) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Check if admin is active
    if (!admin.isActive) {
      res.status(401).json({ message: 'Account is deactivated' });
      return;
    }

    // Verify password
    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Generate token
    const token = generateToken((admin._id as any).toString());

    res.json({
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   POST /api/auth/register
 * @desc    Register new admin (only accessible by existing admin)
 * @access  Private/Admin
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, role } = req.body;

    // Validate input
    if (!email || !password || !name) {
      res.status(400).json({ message: 'Please provide all required fields' });
      return;
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
      res.status(400).json({ message: 'Admin already exists' });
      return;
    }

    // Create admin
    const admin = await Admin.create({
      email,
      password,
      name,
      role: role || 'support',
    });

    const token = generateToken((admin._id as any).toString());

    res.status(201).json({
      message: 'Admin created successfully',
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current admin
 * @access  Private
 */
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const admin = (req as any).admin;
    res.json({ admin });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
