import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage {
  sender: 'user' | 'admin';
  message: string;
  timestamp: Date;
  adminId?: mongoose.Types.ObjectId;
  adminName?: string;
}

export interface IChat extends Document {
  trackingId: string;
  customerName: string;
  customerEmail?: string;
  messages: IMessage[];
  status: 'active' | 'resolved' | 'closed';
  isUnreadByAdmin: boolean;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  sender: {
    type: String,
    enum: ['user', 'admin'],
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  adminId: {
    type: Schema.Types.ObjectId,
    ref: 'Admin'
  },
  adminName: {
    type: String
  }
}, { _id: true });

const ChatSchema = new Schema<IChat>({
  trackingId: {
    type: String,
    required: true,
    uppercase: true
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerEmail: {
    type: String,
    lowercase: true,
    trim: true
  },
  messages: [MessageSchema],
  status: {
    type: String,
    enum: ['active', 'resolved', 'closed'],
    default: 'active'
  },
  isUnreadByAdmin: {
    type: Boolean,
    default: false
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

ChatSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

ChatSchema.index({ trackingId: 1 });
ChatSchema.index({ status: 1 });

export default mongoose.model<IChat>('Chat', ChatSchema);
