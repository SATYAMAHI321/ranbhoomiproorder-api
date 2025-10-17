import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwtHelper';
import Admin from '../models/Admin';

export interface AuthRequest extends Request {
  admin?: any;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({ message: 'Not authorized, no token' });
      return;
    }

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded) {
      res.status(401).json({ message: 'Not authorized, invalid token' });
      return;
    }

    // Find admin
    const admin = await Admin.findById(decoded.id).select('-password');

    if (!admin || !admin.isActive) {
      res.status(401).json({ message: 'Not authorized, admin not found or inactive' });
      return;
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized' });
  }
};

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.admin && req.admin.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized, admin access required' });
  }
};

export const authenticateToken = authenticate;

export const checkPermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    // Superadmins have all permissions
    if (req.admin && req.admin.role === 'superadmin') {
      next();
      return;
    }
    
    // Check if user has the specific permission
    if (req.admin && req.admin.permissions && req.admin.permissions[permission]) {
      next();
      return;
    }
    
    res.status(403).json({ 
      success: false, 
      message: `Not authorized, permission '${permission}' required` 
    });
  };
};

export const checkRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (req.admin && roles.includes(req.admin.role)) {
      next();
      return;
    }
    
    res.status(403).json({ 
      success: false, 
      message: `Not authorized, role '${roles.join(', ')}' required` 
    });
  };
};
