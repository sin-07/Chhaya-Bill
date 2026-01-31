import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct {
  name: string;
  quantity: number;
  unitCost: number;
  total: number;
  width?: number;
  height?: number;
  sqft?: number;
}

export interface IInvoice extends Document {
  invoiceNumber: string;
  clientName: string;
  clientAddress: string;
  products: IProduct[];
  totalAmount: number;
  previousDues: number;
  grandTotal: number;
  dateOfIssue: Date;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceSchema = new Schema<IInvoice>({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  clientName: {
    type: String,
    required: true,
  },
  clientAddress: {
    type: String,
    required: true,
  },
  products: [{
    name: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitCost: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
    },
    width: {
      type: Number,
      required: false,
    },
    height: {
      type: Number,
      required: false,
    },
    sqft: {
      type: Number,
      required: false,
    },
  }],
  totalAmount: {
    type: Number,
    required: true,
    default: 0,
  },
  previousDues: {
    type: Number,
    default: 0,
  },
  grandTotal: {
    type: Number,
    required: true,
  },
  dateOfIssue: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Auto-update timestamp
invoiceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model<IInvoice>('Invoice', invoiceSchema);
