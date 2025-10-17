import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  platform: string;
  description: string;
  price: number;
  validity: number; // in days
  features: string[];
  isActive: boolean;
  category: 'streaming' | 'music' | 'gaming' | 'education' | 'other';
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  platform: {
    type: String,
    required: true,
    trim: true,
    // Examples: Netflix, YouTube Premium, Hotstar, Prime Video, etc.
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  validity: {
    type: Number,
    required: true,
    min: 1,
    // Validity period in days
  },
  features: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  category: {
    type: String,
    enum: ['streaming', 'music', 'gaming', 'education', 'other'],
    default: 'streaming'
  },
  image: {
    type: String,
    default: ''
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

ProductSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model<IProduct>('Product', ProductSchema);
