import mongoose, { Document, Schema } from 'mongoose';

export interface IExternalOrderTracking extends Document {
  externalOrderId: string;
  orderNo: string;
  trackingId: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  productImage?: string;
  productPrice: number;
  status: string;
  originalStatus: string;
  deliveryDescription?: string;
  adminNotes?: string;
  courierLink?: string;
  additionalInfo?: string;
  createdDate: Date;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ExternalOrderTrackingSchema = new Schema<IExternalOrderTracking>({
  externalOrderId: {
    type: String,
    required: true,
    index: true
  },
  orderNo: {
    type: String,
    required: true,
    index: true
  },
  trackingId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    index: true
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
    trim: true,
    index: true
  },
  productName: {
    type: String,
    required: true,
    trim: true
  },
  productImage: {
    type: String,
    trim: true
  },
  productPrice: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'delivered', 'cancelled', 'failed', 'hold'],
    default: 'pending'
  },
  originalStatus: {
    type: String,
    required: true,
    trim: true
  },
  deliveryDescription: {
    type: String,
    trim: true
  },
  adminNotes: {
    type: String,
    trim: true
  },
  courierLink: {
    type: String,
    trim: true
  },
  additionalInfo: {
    type: String,
    trim: true
  },
  createdDate: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
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

ExternalOrderTrackingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  this.lastUpdated = new Date();
  next();
});

ExternalOrderTrackingSchema.index({ trackingId: 1 });
ExternalOrderTrackingSchema.index({ orderNo: 1 });
ExternalOrderTrackingSchema.index({ customerEmail: 1 });
ExternalOrderTrackingSchema.index({ status: 1 });

export default mongoose.model<IExternalOrderTracking>('ExternalOrderTracking', ExternalOrderTrackingSchema);
