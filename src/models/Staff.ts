import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IStaff extends Document {
  name: string;
  email: string;
  password: string;
  role: 'superadmin' | 'admin' | 'staff';
  isActive: boolean;
  permissions: {
    canManageChats: boolean;
    canManageOrders: boolean;
    canManageTracking: boolean;
    canManageProducts: boolean;
    canManageStaff: boolean;
    canViewReports: boolean;
    canDeleteRecords: boolean;
  };
  profile: {
    phone?: string;
    department?: string;
    position?: string;
    avatar?: string;
  };
  lastLogin?: Date;
  createdAt: Date;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const StaffSchema = new Schema<IStaff>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'staff'],
    default: 'staff'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  permissions: {
    canManageChats: { type: Boolean, default: false },
    canManageOrders: { type: Boolean, default: false },
    canManageTracking: { type: Boolean, default: false },
    canManageProducts: { type: Boolean, default: false },
    canManageStaff: { type: Boolean, default: false },
    canViewReports: { type: Boolean, default: false },
    canDeleteRecords: { type: Boolean, default: false }
  },
  profile: {
    phone: { type: String },
    department: { type: String },
    position: { type: String },
    avatar: { type: String }
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    id: { type: String },
    name: { type: String },
    email: { type: String }
  }
});

// Hash password before saving
StaffSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
StaffSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IStaff>('Staff', StaffSchema);