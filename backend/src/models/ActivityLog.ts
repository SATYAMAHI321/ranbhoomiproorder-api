import mongoose, { Document, Schema } from 'mongoose';

export interface IActivityLog extends Document {
  adminId: string;
  adminName: string;
  adminEmail: string;
  action: string;
  category: string;
  details: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

const ActivityLogSchema = new Schema<IActivityLog>({
  adminId: {
    type: String,
    required: true
  },
  adminName: {
    type: String,
    required: true
  },
  adminEmail: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['auth', 'chat', 'order', 'tracking', 'product', 'staff', 'system']
  },
  details: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
});

export default mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);