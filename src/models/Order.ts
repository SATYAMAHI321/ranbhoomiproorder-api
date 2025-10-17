import mongoose, { Document, Schema } from 'mongoose';

export type OrderStatus = 'pending' | 'processing' | 'activated' | 'delivered' | 'expired' | 'failed' | 'cancelled';

export interface IOrder extends Document {
  trackingId: string;
  productId: mongoose.Types.ObjectId;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  status: OrderStatus;
  orderDate: Date;
  deliveryDate?: Date;
  expiryDate?: Date;
  activationCode?: string;
  licenseKey?: string;
  notes?: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>({
  trackingId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  customerPhone: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'activated', 'delivered', 'expired', 'failed', 'cancelled'],
    default: 'pending'
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  deliveryDate: {
    type: Date
  },
  expiryDate: {
    type: Date
  },
  activationCode: {
    type: String,
    trim: true
  },
  licenseKey: {
    type: String,
    trim: true
  },
  notes: {
    type: String
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentAmount: {
    type: Number,
    required: true,
    min: 0
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

OrderSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

OrderSchema.index({ trackingId: 1 });
OrderSchema.index({ customerEmail: 1 });

export default mongoose.model<IOrder>('Order', OrderSchema);
