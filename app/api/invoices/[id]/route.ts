import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chhaya-printing';
let isConnected = false;

async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) return;
  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitCost: { type: Number, required: true },
  total: { type: Number, required: true },
  width: { type: Number, required: false },
  height: { type: Number, required: false },
  sqft: { type: Number, required: false }
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  clientName: { type: String, required: true },
  clientAddress: { type: String, required: true },
  products: [productSchema],
  totalAmount: { type: Number, required: true },
  previousDues: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  dateOfIssue: { type: Date, default: Date.now }
}, { timestamps: true });

const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const invoice = await Invoice.findById(params.id);
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const body = await request.json();
    const invoice = await Invoice.findByIdAndUpdate(params.id, body, { new: true, runValidators: true });
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const invoice = await Invoice.findByIdAndDelete(params.id);
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    return NextResponse.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }
}
