import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dns from 'dns';

// Set DNS servers to Google's public DNS to resolve Atlas SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chhaya-printing';

let isConnected = false;

async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) return;
  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log('MongoDB connected');
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

export async function GET() {
  try {
    await connectDB();
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    return NextResponse.json({ invoices, totalPages: 1, currentPage: 1, total: invoices.length });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ invoices: [], totalPages: 1, currentPage: 1, total: 0 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    console.log('Received invoice data:', JSON.stringify(body, null, 2));
    
    if (!body.invoiceNumber) {
      const count = await Invoice.countDocuments();
      body.invoiceNumber = `INV-${String(count + 1).padStart(4, '0')}`;
    }
    
    // Convert dateOfIssue string to Date if provided
    if (body.dateOfIssue && typeof body.dateOfIssue === 'string') {
      body.dateOfIssue = new Date(body.dateOfIssue);
    }
    
    const invoice = new Invoice(body);
    console.log('Creating invoice:', invoice);
    
    await invoice.save();
    console.log('Invoice saved successfully');
    
    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    console.error('Error details:', error.message);
    if (error.errors) {
      console.error('Validation errors:', JSON.stringify(error.errors, null, 2));
    }
    return NextResponse.json({ 
      error: 'Failed to create invoice', 
      message: error.message,
      details: error.errors 
    }, { status: 500 });
  }
}
